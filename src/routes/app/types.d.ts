interface Lesson {
  isSystem: boolean;
  isAdmin: boolean;
  isBlocked: boolean;
  name: string;
  type: string;
  about: string;
  photoLeson: string;
  id: string;
  title: string;
  description: string;
  username: string;
}
interface Course {
  about: string;
  photoLeson: string;
  id: string;
  title: string;
  description: string;
  title: string;
}
interface Authors {
  about: string;
  photoLeson: string;
  id: string;
  title: string;
  description: string;
  name: string;
}
export interface CustomPageData {
  id: string;
  allLessonsFromTags: Lesson[][];
  names: {
    title: string;
  }[];
  params: string;
  books: Lesson[];
  audioData(audioData: string): unknown;
  language: string;
  data: Lesson;
  series: {
    about: string;
    photoLeson: string;
    id: string;
    title: string;
    lessons: {
      id: string;
      title: string;
    }[];
    series: {
      title: string;
    }[];
  }[];
  coursesAll: Course[];
  authorsAll: Authors[];
  newdata: Lesson[];
  course: {
    id: string;
    title: string;
    lessons: {
      id: string;
      title: string;
    }[];
    series: {
      title: string;
      lessons: {
        id: string;
        title: string;
      }[];
    }[];
    courses: {
      title: string;
      lessons: {
        id: string;
        title: string;
      }[];
      series: {
        title: string;
      }[];
      courses: {
        title: string;
      }[];
    }[];
  }[];
  authors: {
    description: string;
    photoLeson: string;
    id: string;
    name: string;
    title: string;
    lessons: {
      title: string;
    }[];
    series: {
      title: string;
      lessons: {
        title: string;
      }[];
    }[];
    courses: {
      title: string;
      lessons: {
        title: string;
      }[];
      series: {
        title: string;
      }[];
      courses: {
        title: string;
      }[];
    }[];
  }[];
  tag: {
    name: string;
    title: string;
    id: string;
  }[];
  groupTags: {
    groupTags: {
      allTags: allTags;
      name: string;
    }[];
    allTags: {
      lessons: {
        title: string;
        id: string;
        name: string;
      }[];
      name: string;
    }[];
    title: string;
    id: string;
    name: string;
  }[];
}

export interface ReturnSubmit {
  coursesLoaded: Lesson[];
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
  authorsAll: Authors[];
  series: {
    about: string;
    photoLeson: string;
    id: string;
    title: string;
    lessons: {
      id: string;
      title: string;
    }[];
    series: {
      title: string;
    }[];
  }[];
  coursesAll: Course[];
  courses: {
    id: string;
    title: string;
    lessons: {
      id: string;
      title: string;
    }[];
    series: {
      title: string;
      lessons: {
        id: string;
        title: string;
      }[];
    }[];
    courses: {
      title: string;
      lessons: {
        id: string;
        title: string;
      }[];
      series: {
        title: string;
      }[];
      courses: {
        title: string;
      }[];
    }[];
  }[];
  authors: {
    description: string;
    photoLeson: string;
    id: string;
    name: string;
    title: string;
    lessons: {
      title: string;
    }[];
    series: {
      title: string;
      lessons: {
        title: string;
      }[];
    }[];
    courses: {
      title: string;
      lessons: {
        title: string;
      }[];
      series: {
        title: string;
      }[];
      courses: {
        title: string;
      }[];
    }[];
  }[];
  tag: {
    name: string | undefined;
    id: string;
  }[];
  groupTags: {
    groupTags: {
      allTags: allTags;
      name: string;
    }[];
    allTags: {
      lessons: {
        title: string;
        id: string;
        name: string;
      }[];
      name: string;
    }[];
    title: string;
    id: string;
    name: string;
  }[];
}
