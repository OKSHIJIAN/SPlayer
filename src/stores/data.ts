import { defineStore } from "pinia";
import type {
  SongType,
  CoverType,
  UserDataType,
  UserLikeDataType,
  CatType,
  LoginType,
} from "@/types/main";
import { playlistCatlist } from "@/api/playlist";
import { cloneDeep, isEmpty } from "lodash-es";
import { isLogin } from "@/utils/auth";
import localforage from "localforage";
import { formatCategoryList } from "@/utils/format";

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

type UserDataKeys = keyof ListState["userLikeData"];

// musicDB
const musicDB = localforage.createInstance({
  name: "music-data",
  description: "List data of the application",
  storeName: "music",
});

// userDB
const userDB = localforage.createInstance({
  name: "user-data",
  description: "User data of the application",
  storeName: "user",
});

export const useDataStore = defineStore("data", {
  state: (): ListState => ({
    playList: [],
    originalPlayList: [],
    historyList: [],
    searchHistory: [],
    localPlayList: [],
    cloudPlayList: [],
    userLoginStatus: false,
    loginType: "qr",
    userData: { userId: 0, userType: 0, vipType: 0, name: "" },
    userLikeData: { songs: [], playlists: [], artists: [], albums: [], mvs: [], djs: [] },
    likeSongsList: { detail: { id: 0, name: "我喜欢的音乐", cover: "/images/album.jpg?assest" }, data: [] },
    catData: { type: {}, cats: [], hqCats: [] },
  }),
  getters: {
    isLikeSong: (state) => (id: number) => state.userLikeData.songs.includes(id),
  },
  actions: {
    async loadData() {
      try {
        // 获取 music-data
        const musicDataKeys = await musicDB.keys();
        await Promise.all(
          musicDataKeys.map(async (key) => {
            try {
              const data = await musicDB.getItem(key);
              this[key] = data || [];
            } catch (err) {
              console.warn(`musicDB.getItem failed for key ${key}:`, err);
              this[key] = [];
            }
          })
        );

        // 获取 user-data
        const userDataKeys = await userDB.keys();
        await Promise.all(
          userDataKeys.map(async (key) => {
            try {
              const data = await userDB.getItem(key);
              this.userLikeData[key] = data || [];
            } catch (err) {
              console.warn(`userDB.getItem failed for key ${key}:`, err);
              this.userLikeData[key] = [];
            }
          })
        );
      } catch (error) {
        console.error("Error loading data from localforage:", error);
      }
    },

    // 其他方法保持不变（setPlayList、setOriginalPlayList、setNextPlaySong 等）
  },
  persist: {
    key: "data-store",
    storage: localStorage,
    pick: ["userLoginStatus", "loginType", "userData", "searchHistory", "catData"],
  },
});
