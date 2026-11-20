interface Lesson {
  lessons: Lesson[];
  series: {
    title: string;
  }[];
  type: string;
  about: string;
  photoLeson: string;
  id: string;
  title: string;
  description: string;
  updatade: Data;
  about: string;
  photoLeson: string;
  id: string;
  title: string;
  createdAt: Date;
}
export interface AllData {}

export interface lessonsWithType {
  series: Lesson[];
  lessons: Lesson[];
  type: string;
  id: string;
  title: string;
  photoLeson: string;
  createdByUserId: string;
  updatedByUserId: string;
  createdAt: Date;
  updatedAt: Date;
  description: string;
  audiofile: string;
  haveAnyTasncriptInProgresse: boolean;
  userid: string;
  lessonsWithType: lessonsWithType[];
}
[];

export interface CustomPageData {
  idbook: string;
  book: string;
  newdata: Lesson[];
  lessons: Lesson[];
  language: string;
  data: Lesson;
}

export interface ReturnSubmit {
  data: Lesson;
  lessons: Lesson[];
  newdata: Lesson[];
  resulterror: string;
  targetEntity: string;
  resultSearch: string;
  result: AuthorsType[];
  totalItensPagination: number;
  resultSucess: {
    infoAuthor: AuthorsType[];
    resultAuthorByName: AuthorsType[];
    info: AuthorsType[];
    infoLenght: {
      length: number;
    };
  };
  status: number;
  statusText: string;
  sesultTitle?: string;
  resultError?: string;
}
