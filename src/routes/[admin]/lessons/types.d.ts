export interface lessonType {
  series: {
    title: string;
  }[];
  isPublished: boolean;
  id: string;
  contetText: {
    html: string;
    txt: string;
  };
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
  photoLeson: string;
  createdAt: Date | string;
  haveAnyTasncriptInProgresse: boolean;
  transcriptionStatus: 'IDLE' | 'QUEUED' | 'PROCESSING' | 'READY' | 'FAILED';
  transcriptionProgress: number;
  transcriptionError: string | null;
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

interface lessonType {
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
  wsRouter(wsRouter: any): unknown;
  page: null;
  alltags: {
    id: string;
    name: string;
  }[];
  rolesUser: RolesUser[] | null | undefined;
  language: string;
  totalNumbersPagination: number;
  data: lessonType[];
  isSystem: boolean;
  totalNumbersItensLesson: number;
}

export interface CustomPageDataAttachments extends PageData {
  alltags: {
    id: string;
    name: string;
  }[];
  rolesUser: RolesUser[] | null | undefined;
  language: string;
  totalNumbersPagination: number;
  data: lessonType;
  isSystem: boolean;
  totalNumbersItensLesson: number;
}

export interface CustomPageDataUpdate extends PageData {
  language: string;
  totalNumbersPagination: number;
  data: lessonType;
  alltags: {
    id: string;
    name: string;
  }[];
  isSystem: boolean;
  rolesUser: RolesUser[] | null | undefined;
}

export interface ReturnSubmitLessons {
  type: string;
  allLessons: lessonType[];
  totalNumbersItensLesson: number;
  resultSucess: {
    info: lessonType[];
    infoLenght: {
      length: number;
    };
  };
  status: number;
  statusText: string;
  sesultTitle?: string;
  resultError?: string;
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
