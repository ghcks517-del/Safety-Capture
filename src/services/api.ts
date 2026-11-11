import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs, 
  writeBatch,
  query,
  where
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { PhotoItem } from '../types/photo';
import { INITIAL_PHOTOS, PRESET_PROJECTS } from './initialData';

const LOCAL_STORAGE_KEY = 'hanwha_field_photos_v1';
const LOCAL_STORAGE_ADMIN_KEY = 'hanwha_admin_auth_v1';
const LOCAL_STORAGE_PROJECTS_KEY = 'hanwha_field_projects_v1';

function getLocalPhotos(): PhotoItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return INITIAL_PHOTOS;
}

function saveLocalPhotos(photos: PhotoItem[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(photos));
  } catch (e) {
    console.error(e);
  }
}

function getLocalProjects(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PROJECTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return PRESET_PROJECTS;
}

function saveLocalProjects(projects: string[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_PROJECTS_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error(e);
  }
}

// Helper to make safe Firestore ID
function toSafeProjectId(name: string): string {
  const hash = Array.from(name).reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) | 0, 0);
  return `pjt_${Math.abs(hash)}`;
}

export const api = {
  /**
   * Real-time listener for Firestore photos collection.
   */
  subscribePhotos(onUpdate: (photos: PhotoItem[]) => void): () => void {
    const photosCol = collection(db, 'photos');

    const unsubscribe = onSnapshot(
      photosCol,
      async (snapshot) => {
        if (snapshot.empty) {
          try {
            console.log('Seeding initial photos to Firestore...');
            const batch = writeBatch(db);
            INITIAL_PHOTOS.forEach((item) => {
              const docRef = doc(db, 'photos', item.id);
              batch.set(docRef, item);
            });
            await batch.commit();
            onUpdate(INITIAL_PHOTOS);
            saveLocalPhotos(INITIAL_PHOTOS);
            return;
          } catch (seedErr) {
            console.warn('Initial seed error:', seedErr);
            onUpdate(INITIAL_PHOTOS);
            return;
          }
        }

        const items: PhotoItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as PhotoItem;
          items.push({
            ...data,
            id: docSnap.id
          });
        });

        // Sort descending by registrationDate & uploadedAt
        items.sort((a, b) => {
          const dateCompare = (b.registrationDate || '').localeCompare(a.registrationDate || '');
          if (dateCompare !== 0) return dateCompare;
          return (b.uploadedAt || '').localeCompare(a.uploadedAt || '');
        });

        saveLocalPhotos(items);
        onUpdate(items);
      },
      (error) => {
        console.warn('Firestore snapshot error, falling back to local storage:', error);
        handleFirestoreError(error, OperationType.LIST, 'photos');
        onUpdate(getLocalPhotos());
      }
    );

    return unsubscribe;
  },

  /**
   * Real-time listener for managed PJT projects list.
   */
  subscribeProjects(onUpdate: (projects: string[]) => void): () => void {
    const projectsCol = collection(db, 'projects');

    const unsubscribe = onSnapshot(
      projectsCol,
      async (snapshot) => {
        if (snapshot.empty) {
          // Seed preset projects
          try {
            const batch = writeBatch(db);
            PRESET_PROJECTS.forEach((pName) => {
              const pId = toSafeProjectId(pName);
              batch.set(doc(db, 'projects', pId), {
                id: pId,
                name: pName,
                createdAt: new Date().toISOString()
              });
            });
            await batch.commit();
            onUpdate(PRESET_PROJECTS);
            saveLocalProjects(PRESET_PROJECTS);
            return;
          } catch (err) {
            console.warn('Project seed error:', err);
            onUpdate(PRESET_PROJECTS);
            return;
          }
        }

        const list: string[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as { name: string };
          if (data.name && !list.includes(data.name)) {
            list.push(data.name);
          }
        });

        saveLocalProjects(list);
        onUpdate(list);
      },
      (error) => {
        console.warn('Firestore projects listener error, using local fallback:', error);
        handleFirestoreError(error, OperationType.LIST, 'projects');
        onUpdate(getLocalProjects());
      }
    );

    return unsubscribe;
  },

  async addProject(name: string): Promise<void> {
    const trimmed = name.trim();
    if (!trimmed) return;
    const pId = toSafeProjectId(trimmed);

    try {
      await setDoc(doc(db, 'projects', pId), {
        id: pId,
        name: trimmed,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn('Firestore add project fallback:', err);
      handleFirestoreError(err, OperationType.WRITE, `projects/${pId}`);
    }

    const current = getLocalProjects();
    if (!current.includes(trimmed)) {
      saveLocalProjects([...current, trimmed]);
    }
  },

  async updateProject(oldName: string, newName: string): Promise<void> {
    const oldTrimmed = oldName.trim();
    const newTrimmed = newName.trim();
    if (!newTrimmed || oldTrimmed === newTrimmed) return;

    try {
      const oldId = toSafeProjectId(oldTrimmed);
      const newId = toSafeProjectId(newTrimmed);

      const batch = writeBatch(db);
      // Delete old doc and create new doc
      batch.delete(doc(db, 'projects', oldId));
      batch.set(doc(db, 'projects', newId), {
        id: newId,
        name: newTrimmed,
        createdAt: new Date().toISOString()
      });

      // Also update any photos with this old project name
      const q = query(collection(db, 'photos'), where('projectName', '==', oldTrimmed));
      const snap = await getDocs(q);
      snap.forEach((photoDoc) => {
        batch.update(photoDoc.ref, { projectName: newTrimmed });
      });

      await batch.commit();
    } catch (err) {
      console.warn('Firestore update project fallback:', err);
      handleFirestoreError(err, OperationType.UPDATE, 'projects');
    }

    const current = getLocalProjects().map((p) => (p === oldTrimmed ? newTrimmed : p));
    saveLocalProjects(current);
  },

  async deleteProject(name: string): Promise<void> {
    const trimmed = name.trim();
    const pId = toSafeProjectId(trimmed);

    try {
      await deleteDoc(doc(db, 'projects', pId));
    } catch (err) {
      console.warn('Firestore delete project fallback:', err);
      handleFirestoreError(err, OperationType.DELETE, `projects/${pId}`);
    }

    const current = getLocalProjects().filter((p) => p !== trimmed);
    saveLocalProjects(current);
  },

  async getPhotos(): Promise<{ photos: PhotoItem[]; lastModified: number }> {
    try {
      const snap = await getDocs(collection(db, 'photos'));
      if (!snap.empty) {
        const items: PhotoItem[] = [];
        snap.forEach((d) => items.push({ ...d.data() as PhotoItem, id: d.id }));
        items.sort((a, b) => (b.registrationDate || '').localeCompare(a.registrationDate || ''));
        saveLocalPhotos(items);
        return { photos: items, lastModified: Date.now() };
      }
    } catch (err) {
      console.warn('Firestore getDocs error, using local fallback:', err);
    }
    return { photos: getLocalPhotos(), lastModified: Date.now() };
  },

  async uploadPhotos(newPhotos: Partial<PhotoItem>[]): Promise<PhotoItem[]> {
    const createdList: PhotoItem[] = [];

    try {
      const batch = writeBatch(db);

      for (let i = 0; i < newPhotos.length; i++) {
        const item = newPhotos[i];
        const id = item.id || `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const photo: PhotoItem = {
          id,
          url: item.url || '',
          projectName: item.projectName || '한화 프로젝트',
          partnerName: item.partnerName || '협력업체',
          registrationDate: item.registrationDate || new Date().toISOString().split('T')[0],
          uploadedAt: new Date().toISOString(),
          uploaderName: item.uploaderName || '현장 모바일 점검자',
          workType: item.workType || '',
          location: item.location || '',
          description: item.description || '',
          fileSize: item.fileSize || 0,
          dimensions: item.dimensions
        };

        const docRef = doc(db, 'photos', id);
        batch.set(docRef, photo);
        createdList.push(photo);
      }

      await batch.commit();
      return createdList;
    } catch (err) {
      console.error('Firestore upload error:', err);
      handleFirestoreError(err, OperationType.WRITE, 'photos');

      const current = getLocalPhotos();
      const updated = [...createdList, ...current];
      saveLocalPhotos(updated);
      return createdList;
    }
  },

  async updatePhoto(id: string, updates: Partial<PhotoItem>): Promise<PhotoItem> {
    try {
      const docRef = doc(db, 'photos', id);
      await updateDoc(docRef, updates);

      const current = getLocalPhotos().map((p) => (p.id === id ? { ...p, ...updates } : p));
      saveLocalPhotos(current);
      const target = current.find((p) => p.id === id);
      if (!target) throw new Error('사진을 찾을 수 없습니다.');
      return target;
    } catch (err) {
      console.error('Firestore update error:', err);
      handleFirestoreError(err, OperationType.UPDATE, `photos/${id}`);

      const current = getLocalPhotos().map((p) => (p.id === id ? { ...p, ...updates } : p));
      saveLocalPhotos(current);
      const target = current.find((p) => p.id === id);
      if (!target) throw new Error('사진을 찾을 수 없습니다.');
      return target;
    }
  },

  async deletePhoto(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, 'photos', id));
      const current = getLocalPhotos().filter((p) => p.id !== id);
      saveLocalPhotos(current);
      return true;
    } catch (err) {
      console.error('Firestore delete error:', err);
      handleFirestoreError(err, OperationType.DELETE, `photos/${id}`);
      const current = getLocalPhotos().filter((p) => p.id !== id);
      saveLocalPhotos(current);
      return true;
    }
  },

  async deleteBatch(ids: string[]): Promise<boolean> {
    try {
      const batch = writeBatch(db);
      ids.forEach((id) => {
        batch.delete(doc(db, 'photos', id));
      });
      await batch.commit();

      const idSet = new Set(ids);
      const current = getLocalPhotos().filter((p) => !idSet.has(p.id));
      saveLocalPhotos(current);
      return true;
    } catch (err) {
      console.error('Firestore batch delete error:', err);
      handleFirestoreError(err, OperationType.DELETE, 'photos');
      const idSet = new Set(ids);
      const current = getLocalPhotos().filter((p) => !idSet.has(p.id));
      saveLocalPhotos(current);
      return true;
    }
  },

  async resetToDemo(): Promise<PhotoItem[]> {
    try {
      const snap = await getDocs(collection(db, 'photos'));
      const batch = writeBatch(db);
      snap.forEach((d) => batch.delete(d.ref));
      INITIAL_PHOTOS.forEach((item) => {
        batch.set(doc(db, 'photos', item.id), item);
      });

      // Also reset projects
      PRESET_PROJECTS.forEach((pName) => {
        const pId = toSafeProjectId(pName);
        batch.set(doc(db, 'projects', pId), {
          id: pId,
          name: pName,
          createdAt: new Date().toISOString()
        });
      });

      await batch.commit();
    } catch (e) {
      console.warn('Reset demo Firestore warning:', e);
    }
    saveLocalPhotos(INITIAL_PHOTOS);
    saveLocalProjects(PRESET_PROJECTS);
    return INITIAL_PHOTOS;
  },

  async loginAdmin(password: string): Promise<{ success: boolean; message: string }> {
    if (password === '0000') {
      localStorage.setItem(LOCAL_STORAGE_ADMIN_KEY, 'true');
      return { success: true, message: '관리자로 로그인되었습니다.' };
    }
    return { success: false, message: '비밀번호가 올바르지 않습니다.' };
  },

  logoutAdmin() {
    localStorage.removeItem(LOCAL_STORAGE_ADMIN_KEY);
  },

  getStoredAdminStatus(): boolean {
    return localStorage.getItem(LOCAL_STORAGE_ADMIN_KEY) === 'true';
  }
};
