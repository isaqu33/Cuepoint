interface Course {
  lessons: Course[];
  courses: {
    title: string;
  }[];
  series: {
    about: string | undefined;
    description: string;
    photoLeson: string;
    type: string;
    id: string;
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

export interface CoursesWithType {
  series: Course[];
  lessons: Course[];
  courses: Course[];
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
  coursesWithType: CoursesWithType[];
}
[];

export interface CustomPageData {
  newdata: Course[];
  lessons: Course[];
  series: Course[];
  language: string;
  data: Course;
}

export interface ReturnSubmit {
  data: Course;
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
