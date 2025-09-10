import { defineStore } from "pinia";
import type {
  SongType,
  CoverType,
  UserDataType,
  UserLikeDataType,
  CatType,
  LoginType,
} from "@/types/main";
import localforage from "localforage";
import { cloneDeep } from "lodash-es";

// --------------------
// State 类型定义
// --------------------
interface ListState {
  playList: SongType[];
  originalPlayList: SongType[];
  historyList: SongType[];
  cloudPlayList: SongType[];
  searchHistory: string[];
  localPlayList: CoverType[];
  userLoginStatus: boolean;
  loginType: LoginType;
  userData: UserDataType;
  userLikeData: UserLikeDataType;
  likeSongsList: {
    detail: CoverType;
    data: SongType[];
  };
  catData: {
    type: Record<number, string>;
    cats: CatType[];
    hqCats: CatType[];
  };
}

// --------------------
// Localforage 实例
// --------------------
const musicDB = localforage.createInstance({
  name: "music-data",
  description: "List data of the application",
  storeName: "music",
});

const userDB = localforage.createInstance({
  name: "user-data",
  description: "User data of the application",
  storeName: "user",
});

// --------------------
// Pinia Store
// --------------------
export const useDataStore = defineStore<
  "data",
  ListState,
  {
    isLikeSong: (state: ListState) => (id: number) => boolean;
  },
  {
    loadData: () => Promise<void>;
    setPlayList: (data: SongType | SongType[]) => Promise<number>;
    setOriginalPlayList: (data: SongType[]) => Promise<void>;
    getOriginalPlayList: () => Promise<SongType[] | null>;
    clearOriginalPlayList: () => Promise<void>;
    setNextPlaySong: (song: SongType, index: number) => Promise<number>;
    setHistory: (song: SongType) => Promise<void>;
    clearHistory: () => Promise<void>;
    setLikeSongsList: (detail: CoverType, data: SongType[]) => Promise<void>;
    getUserLikePlaylist: () => Promise<any>;
    setCloudPlayList: (data: SongType[]) => Promise<void>;
    setUserLikeData: <K extends keyof ListState["userLikeData"]>(
      name: K,
      data: ListState["userLikeData"][K]
    ) => Promise<void>;
    clearUserData: () => Promise<void>;
    deleteDB: (name?: string) => Promise<void>;
    getPlaylistCatList: () => Promise<void>;
  }
>("data", {
  // --------------------
  // state
  // --------------------
  state: (): ListState => ({
    playList: [],
    originalPlayList: [],
    historyList: [],
    cloudPlayList: [],
    searchHistory: [],
    localPlayList: [],
    userLoginStatus: false,
    loginType: "qr",
    userData: {
      userId: 0,
      userType: 0,
      vipType: 0,
      name: "",
    },
    userLikeData: {
      songs: [],
      playlists: [],
      artists: [],
      albums: [],
      mvs: [],
      djs: [],
    },
    likeSongsList: {
      detail: {
        id: 0,
        name: "我喜欢的音乐",
        cover: "/images/album.jpg?assest",
      },
      data: [],
    },
    catData: {
      type: {},
      cats: [],
      hqCats: [],
    },
  }),

  // --------------------
  // getters
  // --------------------
  getters: {
    isLikeSong: (state) => (id: number) => state.userLikeData.songs.includes(id),
  },

  // --------------------
  // actions
  // --------------------
  actions: {
    async loadData() {
      try {
        const musicKeys = await musicDB.keys();
        await Promise.all(
          musicKeys.map(async (key) => {
            const data = await musicDB.getItem(key);
            (this as any)[key] = data || [];
          })
        );

        const userKeys = await userDB.keys();
        await Promise.all(
          userKeys.map(async (key) => {
            const data = await userDB.getItem(key);
            (this.userLikeData as any)[key] = data;
          })
        );
      } catch (err) {
        console.error("Error loading data:", err);
      }
    },

    async setPlayList(data: SongType | SongType[]): Promise<number> {
      if (Array.isArray(data)) {
        this.playList = data;
        await musicDB.setItem("playList", cloneDeep(data));
        return 0;
      } else {
        const song = cloneDeep(data);
        const filtered = this.playList.filter((s) => s.id !== song.id);
        filtered.push(song);
        this.playList = filtered;
        await musicDB.setItem("playList", cloneDeep(filtered));
        return filtered.length - 1;
      }
    },

    async setOriginalPlayList(data: SongType[]) {
      this.originalPlayList = cloneDeep(data);
      await musicDB.setItem("originalPlayList", this.originalPlayList);
    },

    async getOriginalPlayList() {
      if (this.originalPlayList.length) return this.originalPlayList;
      const data = (await musicDB.getItem("originalPlayList")) as SongType[] | null;
      if (data?.length) this.originalPlayList = data;
      return data;
    },

    async clearOriginalPlayList() {
      this.originalPlayList = [];
      await musicDB.setItem("originalPlayList", []);
    },

    async setNextPlaySong(song: SongType, index: number) {
      if (!this.playList.length) {
        this.playList = [song];
        await musicDB.setItem("playList", cloneDeep(this.playList));
        return 0;
      }
      const idx = index + 1;
      this.playList.splice(idx, 0, song);
      this.playList = this.playList.filter((item, i) => i === idx || item.id !== song.id);
      await musicDB.setItem("playList", cloneDeep(this.playList));
      return this.playList.findIndex((item) => item.id === song.id);
    },

    async setHistory(song: SongType) {
      let list: SongType[] = (await musicDB.getItem("historyList")) || [];
      song = cloneDeep(song);
      list = [song, ...list.filter((i) => i.id !== song.id)];
      if (list.length > 500) list.splice(500);
      this.historyList = list;
      await musicDB.setItem("historyList", list);
    },

    async clearHistory() {
      this.historyList = [];
      await musicDB.setItem("historyList", []);
    },

    async setLikeSongsList(detail: CoverType, data: SongType[]) {
      this.likeSongsList = { detail, data };
      await musicDB.setItem("likeSongsList", cloneDeep({ detail, data }));
    },

    async getUserLikePlaylist() {
      const data = await musicDB.getItem("likeSongsList");
      return data;
    },

    async setCloudPlayList(data: SongType[]) {
      this.cloudPlayList = data;
      await musicDB.setItem("cloudPlayList", cloneDeep(data));
    },

    async setUserLikeData<K extends keyof ListState["userLikeData"]>(
      name: K,
      data: ListState["userLikeData"][K]
    ) {
      this.userLikeData[name] = data;
      await userDB.setItem(name, cloneDeep(data));
    },

    async clearUserData() {
      this.userLoginStatus = false;
      this.loginType = "qr";
      this.userData = { userId: 0, userType: 0, vipType: 0, name: "" };
      for (const key of Object.keys(this.userLikeData) as (keyof UserLikeDataType)[]) {
        this.userLikeData[key] = [];
        await this.setUserLikeData(key, []);
      }
    },

    async deleteDB(name?: string) {
      if (name) {
        await localforage.dropInstance({ name });
        return;
      }
      await musicDB.clear();
      await userDB.clear();
    },

    async getPlaylistCatList() {
      // 占位，具体逻辑可按原来 playlistCatlist/formatCategoryList 补充
    },
  },

  // --------------------
  // 持久化
  // --------------------
  persist: {
    key: "data-store",
    storage: localStorage,
    pick: ["userLoginStatus", "loginType", "userData", "searchHistory", "catData"],
  },
});
