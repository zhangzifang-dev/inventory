export class ResponseDto<T> {
  code: number;
  message: string;
  data: T | null;

  static success<T>(data: T, message: string = 'success'): ResponseDto<T> {
    const response = new ResponseDto<T>();
    response.code = 0;
    response.message = message;
    response.data = data;
    return response;
  }

  static error<T>(code: number, message: string): ResponseDto<T> {
    const response = new ResponseDto<T>();
    response.code = code;
    response.message = message;
    response.data = null;
    return response;
  }
}

export class PaginatedResponseDto<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;

  static create<T>(
    list: T[],
    total: number,
    page: number,
    pageSize: number,
  ): PaginatedResponseDto<T> {
    const response = new PaginatedResponseDto<T>();
    response.list = list;
    response.total = total;
    response.page = page;
    response.pageSize = pageSize;
    return response;
  }
}
