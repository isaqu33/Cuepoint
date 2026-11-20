import type { Actions, PageServerLoad } from './$types';
import { getAllBooks } from './_actions/get-all-books.server';

import { getMoreCoursesPagination } from './_actions/get-more-courses-pagination';
import { getMoreLessonsPagination } from './_actions/get-more-lessons-pagination';
import { getMoreSeriesPagination } from './_actions/get-more-series-pagination';

export const load: PageServerLoad = getAllBooks;

export const actions: Actions = {
  getMoreSeriesPagination,
  getMoreCoursesPagination,
  getMoreLessonsPagination,
};
