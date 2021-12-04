import express, { Response } from "express";
import { postModel, userModel } from "../config/db";
import auth from "../middlewares/auth";
import bodyParser from "body-parser";
import { IComment, IPost, ILike } from "../types/postTypes";
import multer from "multer";
import { uploadImages } from "../modules/handleImage";
import { User } from "../types/user";
import chunkArray from "../modules/chunkArray";
import reqUser from "../types/reqUser"
import { getUserInfo } from "../modules/getUserInfo"
import mongoose from "mongoose"

declare global {
  namespace Express {
    interface Request {
      user?: reqUser,
      cookies?: any,
      body?: any
    }
  }
}

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
  return mongoose.Types.ObjectId.isValid(id)
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

// convert user id to user name
const getUserName = async (id: string) => {
  if (!id) return "none";
  const user = await userModel.findOne({ _id: id });
  if (!user) return "undefined"
  return user.name;
};

const removeUserIdFromComment = async (comment: IComment) => {
  if (!comment) return;
  const { _id, content, likes, timestamp, authorId } = comment;
  const author = await getUserInfo(authorId) as User;
  return {
    _id, content, likes,
    timestamp: Number(timestamp),
    author: {
      _id: authorId,
      name: author.name,
      avatar: author.avatar,
      email: author.email
    }
  };
}

const removeUserIdFromLike = async (like: ILike) => {
  if (!like) return;
  const { authorId } = like;
  const author = await getUserInfo(authorId) as User;
  if (!author) return;
  return {
    author: {
      id: authorId,
      name: author.name,
      avatar: author.avatar
    }
  }
}

// 유저 아이디들을 유저 정보로 바꿔준다(이름, 아바타, id)
export const preProcessIdFromPost = async (post: IPost) => {
  if (!post) return;
  const { _id, pictures, text, timestamp, authorId, comments, likes } = post;
  const author = await getUserInfo(authorId) as User;
  if (!author) return;
  const comments_ = await Promise.all(
    comments.map((comment) => {
      return removeUserIdFromComment(comment);
    })
  );
  const likes_ = await Promise.all(
    likes.map(like => {
      return removeUserIdFromLike(like)
    })
  );

  return {
    _id, pictures, text,
    timestamp: Number(timestamp),
    author: {
      _id: authorId,
      name: author.name,
      avatar: author.avatar,
      email: author.email
    },
    comments: comments_,
    likes: likes_
  };
}

router.get('/:id', async (req, res) => {
  const id = req.params?.id;
  if (!validatePostId(id)) {
    return res.status(400).send("bad id");
  }
  const post = await postModel.findById(id);

  if (!post) return res.status(404).send("id not exist");

  const postWithUserName = await preProcessIdFromPost(post);

  return res.json(postWithUserName);
});

router.delete('/:id', auth, async (req, res) => {
  // 아래 5라인 중복됨
  const id = req.params?.id;
  if (!validatePostId(id)) {
    return res.status(400).send("bad id");
  }
  const post = await postModel.findOne({ _id: id });
  if (!post) return res.status(404).send("id not exist");

  if (post.authorId !== req.user?._id) {
    return res.status(403).send("you are not author");
  }
  try {
    await postModel.deleteOne({ _id: id });
    return res.send("delete successful");
  } catch (e) {
    return res.status(500).send("server error");
  }
})

// 새로운 post 만들기
// Request Body: { text: string[] }
// author는 id형태로 반환된다.
router.post('/new', [auth, upload.array('pictures', pageSize)], async (req: Express.Request, res: Response) => {
  if (!req.files) {
    return res.status(400).send("bad post: no images");
  }
  const pictures: Express.Multer.File[] = req.files as Express.Multer.File[];
  // 이미지를 문자열 주소의 형태로 변환 후 데이터베이스에 등록
  const pictureAddrPromises = uploadImages(pictures.map(picture => picture.filename))
  const pictureAddrs = await Promise.all(pictureAddrPromises);
  const text = req.body?.text;

  const post = new postModel({
    pictures: pictureAddrs,
    authorId: req.user._id,
    text: text,
    likes: [],
    comments: [],
    timestamp: new Date()
  });
  await post.save();
  const postWithUserName = await preProcessIdFromPost(post);

  return res.json(postWithUserName);
})

// query로 페이지, 페이지 사이즈 받아서 그만큼 반환
// query로 전달된 값이 없으면 1페이지, 10사이즈로 받아서 반환
router.get('/', async (req, res) => {
  const { page, pageSize, userId } = req.query;

  const pageNum = page ? Number(page) : 1;
  const pageSizeNum = pageSize ? Number(pageSize) : 10;

  let posts: IPost[];
  if (!userId) posts = await postModel.find();
  else {
    const user: User = await userModel.findById(userId);
    if (user.following?.length === 0) {
      posts = await postModel.find({ 'authorId': { $ne: userId as string } });
    } else {
      posts = await postModel.find({
        'authorId': {
          $in: user.following.map(
            _id => _id.toString()
          )
        }
      });
    }
  }
  if (!posts || posts.length === 0) return res.status(404).send("no posts");
  const postsChunk = chunkArray<IPost>(posts, pageSizeNum);
  const totalPosts = posts.length;
  const totalPages = postsChunk.length;
  if (totalPages < Number(page)) return res.status(200).json({})

  const data = await Promise.all(postsChunk[pageNum - 1].map(
    async (post: IPost) => await preProcessIdFromPost(post)
  ))
  return res.json({
    totalPosts,
    totalPages,
    currentPage: pageNum,
    pageSize: pageSizeNum,
    data
  })
})

// post로 코멘트 받아서 저장
// req.param으로 postId 받아서 저장
// 변경된 post를 반환
// Request body: { content: string }
// FIXME: req any
router.post('/:id/comment', auth, async (req: any, res) => {
  const id = req.params?.id;
  if (!validatePostId(id)) {
    return res.status(400).send("bad id");
  }
  const post = await postModel.findOne({ _id: id });
  if (!post) return res.status(404).send("id not exist");

  // FIXME: content type이 any임
  const { content } = req.body;
  if (content.length <= 0) {
    return res.status(400).send("bad comment");
  }

  const comment = {
    _id: post.comments.length,
    content: content,
    likes: [],
    authorId: req.user._id,
    timestamp: new Date()
  }

  post.comments.push(comment);
  post.save();

  return res.json(await removeUserIdFromComment(comment));
});

router.delete('/:postId/comment/:commentId', auth, async (req, res) => {
  const { postId, commentId } = req.params;
  if (!validatePostId(postId)) {
    return res.status(400).send("bad id");
  }
  if (isNaN(Number(commentId))) return res.status(400).send('bad index');
  const post = await postModel.findOne({ _id: postId });
  if (!post) return res.status(404).send("postid not exist");

  const c = post.comments.find(comment => comment._id === Number(commentId));
  const i = post.comments.indexOf(c);
  if (!c) return res.status(404).send("comment not exist");
  if (c.authorId !== req.user._id) {
    return res.status(403).send("you are not author");
  }

  post.comments.splice(i, 1);
  post.save();

  return res.send("delete successful");
})

router.post('/:id/edit', auth, async (req: any, res) => {
  const id = req.params?.id;
  if (!validatePostId(id)) {
    return res.status(400).send("bad id");
  }
  const post = await postModel.findOne({ _id: id });
  if (!post) return res.status(404).send("id not exist");
  if (post.authorId !== req.user._id) {
    return res.status(403).send("you are not author");
  }

  const { text } = req.body;
  if (text) post.text = text;

  await post.save();
  return res.json(await preProcessIdFromPost(post));
})

export default router;