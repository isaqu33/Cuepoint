interface Lesson {
  about: string;
  photoLeson: string;
  id: string;
  title: string;
  description: string;
  contetText: {
    html: string;
  };
}
interface Course {
  about: string;
  photoLeson: string;
  id: string;
  title: string;
  description: string;
  title: string;
}
export interface CustomPageData {
  studies: string;
  idstudies: string;
  book: string;
  book: string;
  idbook: string;
  language: string;
  isAdmin: boolean;
  data: {
    description: string;
    attachments: {
      id: string;
      files: {
        id: string;
        path: string;
        name: string;
      }[];
    }[];
    transcript: {
      transcription: string | null;
      vtt?: string | null;
    };
    photoLeson: string;
    id: string;
    title: string;
    audiofile: string;
    files?: { type?: string | null }[];
    contetText: {
      html: string;
    };
  };
}

export interface ReturnSubmit {
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
