import {
  collection,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';

export interface CloudFamilyTree {
  id: string;
  name: string;
  familyHead: string;
  members: any[];
  posts?: any[];
  updatedAt: string;
  lastEditor?: string;
}

export interface CloudEmergencySignal {
  id: string;
  userId: string;
  userName: string;
  type: string;
  status: 'active' | 'resolved';
  address?: string;
  lat?: number;
  lng?: number;
  timestamp: string;
}

export interface CloudChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole?: string;
  text: string;
  timestamp: string;
}

export class RealtimeSyncService {
  private static defaultTreeId = 'trah-keluarga-utama';

  /**
   * Mengambil atau membuat ID Ruang Cloud Keluarga Otomatis
   */
  public static getFamilyTreeId(): string {
    const saved = localStorage.getItem('wargaqu_cloud_family_tree_id');
    if (saved && saved.trim()) return saved.trim();

    // Buat ID unik keluarga baru jika belum ada
    const newId = `trah-${Date.now().toString(36)}`;
    localStorage.setItem('wargaqu_cloud_family_tree_id', newId);
    return newId;
  }

  public static setFamilyTreeId(treeId: string) {
    if (treeId && treeId.trim()) {
      localStorage.setItem('wargaqu_cloud_family_tree_id', treeId.trim());
    }
  }

  /**
   * Berlangganan (Subscribe) perubahan silsilah secara realtime.
   * Begitu ada kerabat yang menambah/mengedit data, callback terpanggil seketika.
   */
  public static subscribeFamilyTree(
    treeId: string,
    onData: (data: CloudFamilyTree) => void,
    onError?: (err: Error) => void
  ): Unsubscribe {
    const cleanId = treeId || this.defaultTreeId;
    const docRef = doc(db, 'family_trees', cleanId);

    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as CloudFamilyTree;
          onData(data);
        }
      },
      (error) => {
        console.warn('Realtime LeluhurQu listener notice:', error.message);
        if (onError) onError(error);
      }
    );
  }

  /**
   * Menyimpan / Menyinkronkan perubahan Silsilah ke Cloud secara otomatis
   */
  public static async pushFamilyTreeToCloud(
    treeId: string,
    name: string,
    familyHead: string,
    members: any[],
    posts?: any[],
    editorName?: string
  ): Promise<boolean> {
    try {
      const cleanId = treeId || this.defaultTreeId;
      const docRef = doc(db, 'family_trees', cleanId);

      const payload: CloudFamilyTree = {
        id: cleanId,
        name: name || 'Silsilah Keluarga Besar',
        familyHead: familyHead || 'Kepala Keluarga',
        members: members || [],
        posts: posts || [],
        updatedAt: new Date().toISOString(),
        lastEditor: editorName || 'Kerabat'
      };

      await setDoc(docRef, payload, { merge: true });
      return true;
    } catch (err) {
      console.warn('Gagal sinkronisasi silsilah ke cloud:', err);
      return false;
    }
  }

  /**
   * Tarik data silsilah terbaru dari Cloud saat pertama kali dibuka
   */
  public static async fetchFamilyTreeOnce(treeId: string): Promise<CloudFamilyTree | null> {
    try {
      const cleanId = treeId || this.defaultTreeId;
      const docRef = doc(db, 'family_trees', cleanId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as CloudFamilyTree;
      }
      return null;
    } catch {
      return null;
    }
  }

  // =================== SIAGAQU REALTIME SOS ===================
  public static async broadcastSOS(signal: CloudEmergencySignal): Promise<boolean> {
    try {
      const docRef = doc(db, 'emergency_signals', signal.id);
      await setDoc(docRef, signal, { merge: true });
      return true;
    } catch {
      return false;
    }
  }

  public static subscribeActiveSOS(
    onData: (signals: CloudEmergencySignal[]) => void
  ): Unsubscribe {
    const colRef = collection(db, 'emergency_signals');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: CloudEmergencySignal[] = [];
        snapshot.forEach((d) => {
          const item = d.data() as CloudEmergencySignal;
          if (item.status === 'active') {
            list.push(item);
          }
        });
        onData(list);
      },
      (error) => {
        console.warn('SiagaQu SOS listener notice:', error.message);
      }
    );
  }

  // =================== CHATQU REALTIME PESAN ===================
  public static async sendChatMessage(msg: CloudChatMessage): Promise<boolean> {
    try {
      const docRef = doc(db, 'chat_messages', msg.id);
      await setDoc(docRef, msg);
      return true;
    } catch {
      return false;
    }
  }

  public static subscribeChatMessages(
    onData: (messages: CloudChatMessage[]) => void
  ): Unsubscribe {
    const colRef = collection(db, 'chat_messages');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: CloudChatMessage[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as CloudChatMessage);
        });
        // Urutkan berdasarkan waktu
        list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        onData(list);
      },
      (error) => {
        console.warn('ChatQu listener notice:', error.message);
      }
    );
  }
}
