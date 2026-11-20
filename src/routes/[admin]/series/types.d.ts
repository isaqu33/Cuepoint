export interface SerieType {
  series: { lessons: { id: string; title: string }[]; series: { id: string; title: string }[] }[];
  lessons: { lessons: { id: string; title: string }[]; series: { id: string; title: string }[] }[];
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
  transcript: {
    id: string;
    transcription: string;
  };
  infoLenght: number;
  title: string;
  isPublished: boolean;
  photoLeson: string;
  photoSerie: string;
  courses: {
    id: string;
    title: string;
  }[];
  createdAt: Date | string;
  haveAnyTasncriptInProgresse: boolean;
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReturnSubmit {
  result: SerieType[];
  totalNumbersItensSerie: number;
  resultSucess: {
    info: SerieType[];
    infoLenght: {
      lessons: { id: string; title: string }[];
      series: { id: string; title: string }[];
    }[];
  };
  totalUsers: number;
  status: number;
  sesultTitle?: string;
  resultError?: string;
  totalNumbersItens: number;
  statusText: string;
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
  allSeries: { id: string; title: string }[];
  [];
  lessons: { id: string; title: string }[];
  allGroupTags: {
    id: string;
    name: string;
  }[];
  series: { id: string; title: string }[][];
  userInfo: RolesUser;
  alltags: {
    id: string;
    name: string;
  }[];
  rolesUser: RolesUser[] | null | undefined;
  language: string;
  totalNumbersPagination: number;
  data: SerieType[];
  isSystem: boolean;
  totalNumbersItens: number;
  page: number;
}

export interface CustomPageDataUpdate extends PageData {
  allSeries: { id: string; title: string }[];
  lessons: { id: string; title: string }[];
  language: string;
  totalNumbersPagination: number;
  data: lessonType;
  alltags: {
    id: string;
    name: string;
  }[];
  isSystem: boolean;
  rolesUser: RolesUser[] | null | undefined;
  allGroupTags: {
    id: string;
    name: string;
  }[];
}

interface TypeFile {
  path: string;
  id: string;
  files: {
    id: string;
  };
}
interface UserType {
  about: string;
  grouptag: {
    id: number;
  }[];
  series: {
    title: string;
    id: number;
  }[];
  lessons: {
    title: string;
    id: number;
  }[];
  tags: {
    id: string;
  }[];
  title: string;
  files: TypeFile[];
  attachments: TypeFileattachments[];
  photoLeson: string;
  audiofile: string;
  user: {
    id: string;
    email: string;
    username: string;
    name: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  contetText: {
    id: string;
    html: string;
    txt: string;
    createdAt: Date;
    updatedAt: Date;
    lessonId: string | null;
  };
}

interface TypeFileattachments {
  id: string;
  files: {
    id: string;
  }[];
}
export interface ReturnSubmit {
  status: number;
  statusText: string;
  hasChanges?: boolean;
}
