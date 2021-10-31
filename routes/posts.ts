import express from "express";
import { postModel, userModel, imageModel } from "../config/db";
import auth from "../middlewares/auth";
import bodyParser from "body-parser";
import { IComment, IPost } from "../types/postTypes";
import multer from "multer";
import randomString from "../modules/randomString";
import { uploadImage } from "../modules/handleImage";
import mongoose from "mongoose"

const ObjectId = mongoose.Types.ObjectId;

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/images');
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname + '-' + Date.now().valueOf());
    }
  }),
});

const router = express.Router();

const pageSize = 10;

router.use(bodyParser.json());

const validatePostId = (id: any) => {
  if (isNaN(id)) return false;
  else return true;
}

const validatePost = (post: IPost) => {
  if (post.pictures.length <= 0) {
    return false;
  } else if (!post.authorId) {
    return false;
  }
  return true;
}

// const validateComment = (comment: IComment) => {
//   if (comment.content.length <= 0 || !comment.content) {
//     return false;
//   } else if (!comment.author) {
//     return false;
//   }
//   return true;
// }

const chunkArray = <T>(myArray: T[], chunk_size: number): T[][] => {
  const arrayLength = myArray.length;
  const tempArray: T[][] = [];

  for (let i = 0; i < arrayLength; i += chunk_size) {
    const myChunk = myArray.slice(i, i + chunk_size);
    tempArray.push(myChunk);
  }

  return tempArray;
}

// convert user id to user name
const getUserName = async (id?: string) => {
  if (!id) return "none";
  const user = await userModel.findOne({ _id: new ObjectId(id) });
  if (!user) return "undefined"
  return user.name;
};

const removeUserIdFromComment = async (comment: IComment) => {
  if (!comment) return;
  const { authorId, content, likes } = comment;
  const authorName = await getUserName(authorId)
  if (!authorName) return undefined;
  return {
    authorName: authorName,
    content: content,
    likes: likes
  };
}

// convert all user IDs to user names
const removeUserIdFromPost = async (post: IPost) => {
  if (!post) return;
  const { _id, authorId, comments, likes, pictures } = post;
  const authorName = await getUserName(authorId);
  const commentsName = await Promise.all(comments.map(async (comment) => {
    const { authorId, content, likes } = comment;
    console.log("authorId:" + authorId)
    return {
      authorName: await getUserName(authorId),
      content: content,
      likes: likes
    }
  }));
  const likesName = await Promise.all(likes.map(async like => {
    const { authorId } = like;
    return { authorName: await getUserName(authorId) }
  }));

  console.log("commentsName: " + commentsName)

  return {
    _id: _id,
    authorName: authorName,
    comments: commentsName,
    likes: likesName,
    pictures: pictures
  };
}

router.get('/:id', async (req, res) => {
  const id = req.params.id;
  if (!validatePostId(id)) {
    return res.status(400).send("bad id")
  }
  const post = await postModel.findById(id)

  if (!post) return res.status(404).send("id not exist");

  const postWithUserName = await removeUserIdFromPost(post);

  return res.json(postWithUserName);
});

// 로그인만 되어있다면 삭제 가능하도록 되어있음(auth 미들웨어) TODO: 삭제 권한 관리
router.delete('/:id', auth, async (req, res) => {
  // 아래 5라인 중복됨
  const id = req.params.id;
  if (!validatePostId(id)) {
    return res.status(400).send("bad id");
  }
  const post = await postModel.findOne({ _id: id });
  if (!post) return res.status(404).send("id not exist");

  await postModel.deleteOne({ _id: id });

  // 삭제 잘 되었는지 따로 검증 x
  return res.send("delete successful");
})

// 새로운 post 만들기
// Request Body: { pictures: string[] }
// author는 id형태로 반환된다.
router.post('/new', [auth, upload.array('pictures', 10)], async (req: express.Request, res) => {
  if (!(req as any).files) {
    return res.status(400).send("bad post: no images");
  }
  const pictures: Express.Multer.File[] = req.files as Express.Multer.File[];
  // 이미지를 문자열 주소의 형태로 변환 후 데이터베이스에 등록
  const pictureAddrPromises = uploadImage(pictures.map(picture => picture.filename))
  const pictureAddrs = await Promise.all(pictureAddrPromises);

  const post = new postModel({
    pictures: pictureAddrs,
    authorId: req.user._id,
    likes: [],
    comments: []
  });
  await post.save();
  const postWithUserName = await removeUserIdFromPost(post);
  return res.json(postWithUserName);
})

// query로 페이지, 페이지 사이즈 받아서 그만큼 반환
// query로 전달된 값이 없으면 1페이지, 10사이즈로 받아서 반환
router.get('/', async (req, res) => {
  const { page, pageSize } = req.query;

  const pageNum = page ? Number(page) : 1;
  const pageSizeNum = pageSize ? Number(pageSize) : 10;

  const posts: IPost[] = await postModel.find();
  const postsChunk = chunkArray<IPost>(posts, pageSizeNum);

  const data = await Promise.all(postsChunk[pageNum - 1].map(
    async (post: IPost) => await removeUserIdFromPost(post)
  ))
  return res.json(data)
})

// post로 코멘트 받아서 저장
// req.param으로 postId 받아서 저장
// 변경된 post를 반환
// Request body: { content: string }
router.post('/:id/comment', auth, async (req: express.Request, res) => {
  const id = req.params.id;
  if (!validatePostId(id)) {
    return res.status(400).send("bad id");
  }
  const post = await postModel.findOne({ _id: id });
  console.log("post: " + post)
  if (!post) return res.status(404).send("id not exist");

  // FIXME: content type이 any임
  const { content } = req.body;
  if (content.length <= 0) {
    return res.status(400).send("bad comment");
  }

  const comment: IComment = {
    content: content,
    likes: [],
    authorId: req.user._id
  };
  post.comments.push(comment);
  post.save();

  return res.json(await removeUserIdFromComment(comment));
});

export default router;