export interface IComment {
  authorName: string,
  content: string,
  likes: ILike[]
}

export interface ILike {
  authorId: string
}

export interface IPost {
  // author은 토큰 또는 objectID와 같은 일련번호.
  _id: number,
  authorId: string,
  pictures: string[],
  likes: ILike[],
  comments: IComment[],
}