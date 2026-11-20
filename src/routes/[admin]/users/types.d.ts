export interface userType {
  request: unknown;
  isBlocked: boolean;
  isAdmin: boolean;
  groupActions: {
    name: string;
    id: string;
  };
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  emailservice: string;
  roles: {
    action: string;
    createdAt: Date;
    description: string;
    entity: string;
    id: string;
    updatedAt: Date;
  }[];
}

export interface CustomPageData extends PageData {
  iduser: string;
  id: string;
  page: null;
  rolesUser: RolesUser[] | null | undefined;
  language: string;
  totalNumbersPagination: number;
  data: userType[];
  userSystem: string;
  userLoged: string;
  isSystem: boolean;
  allGroupActions: {
    name: string;
    id: string;
  }[];
  userInfo: {
    isSystem: boolean;
    groupActions: {
      roles: {
        action: string;
        createdAt: Date;
        description: string;
        entity: string;
        id: string;
        updatedAt: Date;
      }[];
    };
  };
}

export interface CustomPageDataUpdate extends PageData {
  rolesUser: RolesUser[] | null | undefined;
  language: string;
  totalNumbersPagination: number;
  data: userType;
  isSystem: boolean;
  allGroupActions: {
    name: string;
    id: string;
  }[];
}

export interface ReturnSubmitUsers {
  type: string;
  existingUserName: null;
  existingUserEmail: null;
  resultSucess: {
    updatedAt: Date;
    name: string;
    email: string;
    id: string;
    EmailVerified: string;
    emailservice: string;
  }[];
  totalUsers: number;
  status: number;
  allData: {
    updatedAt: Date;
    name: string;
    email: string;
    id: string;
    EmailVerified: string;
    emailservice: string;
  }[];
  totalNumbersPagination: number;
  sesultTitle?: string;
  resultError?: string;
  statusText: string;
  status: number;
}

export interface RolesUser {
  isSystem: boolean | undefined;
  groupActions: {
    isSystem: boolean | undefined;
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
