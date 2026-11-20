export interface CourseType {
  isPublished: boolean;
  about: string;
  groupTags: { id: string }[];
  courses: { id: string; title: string }[];
  series: { id: string; title: string }[];
  lessons: { id: string; title: string }[];
  id: string;
  tags: {
    id: string;
    name: string;
  }[];
  files: {
    id: string;
  }[];
  attachments: {
    id: string;
    files: {
      path: string;
      size: number;
      name: string;
      id: string;
    }[];
  }[];
  audiofile: string;
  infoLenght: number;
  title: string;
  photoLeson: string;
  createdAt: Date | string;
  haveAnyTasncriptInProgresse: boolean;
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

interface TypeFileattachments {
  id: string;
  files: {
    id: string;
  }[];
}
interface TypeFile {
  id: string;
  files: {
    id: string;
  };
}

interface UserType {
  tags: {
    id: string;
  }[];
  title: string;
  files: TypeFile[];
  attachments: TypeFileattachments[];
  photoLeson: string;
  audiofile: string;
  contetText: {
    id: string;
    html: string;
    txt: string;
    createdAt: Date;
    updatedAt: Date;
    lessonId: string | null;
  };
}

export interface RolesUser {
  isSystem: boolean;
  groupActions: {
    roles: RolesUser[] | undefined;
    action: string;
    createdAt: Date;
    description: string;
    entity: string;
    id: string;
    updatedAt: Date;
  };

  action: string;
  createdAt: Date;
  description: string;
  entity: string;
  id: string;
  updatedAt: Date;
}

export interface CustomPageData extends PageData {
  totalItemsByPage: number;
  page: null;
  allCourses: { id: string; title: string }[];
  allSeries: { id: string; title: string }[];
  lessons: { id: string; title: string }[];
  alltags: {
    id: string;
    name: string;
  }[];
  allGroupTags: {
    id: string;
    name: string;
  }[];
  rolesUser: RolesUser[] | null | undefined;
  language: string;
  totalNumbersPagination: number;
  data: CourseType[];
  isSystem: boolean;
  totalNumbersItensCourse: number;
  userInfo: RolesUser;
}

export interface CustomPageDataUpdate extends PageData {
  allCourses: { id: string; title: string }[];
  allSeries: { id: string; title: string }[];
  getAlllessons: { id: string; title: string }[];
  language: string;
  totalNumbersPagination: number;
  data: CourseType;
  alltags: {
    id: string;
    name: string;
  }[];
  allGroupTags: {
    id: string;
    name: string;
  }[];
  isSystem: boolean;
  rolesUser: RolesUser[] | null | undefined;
}

interface ReturnSubmit {
  text: string;
  type: string;
  totalNumbersItensCourse: number;
  AllCourses: CourseType[];
  result: { lessons: { id: string; title: string }[]; series: { id: string; title: string }[] }[];
  resultSucess: {
    info: CourseType[];

    infoLenght: {
      lessons: { id: string; title: string }[];
      series: { id: string; title: string }[];
    }[];
  };
  totalUsers: number;
  status: number;
  sesultTitle?: string;
  resultError?: string;
  statusText: string;
}

export interface NewFileArraytoDb {
  size: number;
  type: string;
  name: string;
  lastModified: number;
  path: string;
}

export interface FileArray extends File {
  arrayBuffer(): Promise<ArrayBuffer>;
}

export interface FileToDelete {
  id: string;
  size: string | null;
  type: string | null;
  name: string | null;
  lastModified: string | null;
  path: string;
  createdAt: Date;
  updatedAt: Date;
  createdByUserId: string | null;
  updatedByUserId: string | null;
}
