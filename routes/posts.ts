import express from "express";
import { postModel, userModel, imageModel } from "../config/db";
import auth from "../middlewares/auth";
import bodyParser from "body-parser";
import { IComment, IPost } from "../types/postTypes";
import multer from "multer";
import randomString from "../modules/randomString";
import { uploadImage } from "../modules/handleImage";

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

const chunkArray = (myArray: any[], chunk_size: number) => {
  const arrayLength = myArray.length;
  const tempArray = [];

  for (let i = 0; i < arrayLength; i += chunk_size) {
    const myChunk = myArray.slice(i, i + chunk_size);
    tempArray.push(myChunk);
  }

  return tempArray;
}

// convert user id to user name
const getUserName = async (id: string) => {
  const user = await userModel.findById(id);
  return user.name;
};

// convert all user IDs to user names
const removeUserIdFromPost = async (post: IPost) => {
  if (!post) return;
  const { authorId, comments, likes, _id, pictures } = post;
  const authorName = await getUserName(authorId);
  const commentsName = comments.map(async comment => { await getUserName(comment.authorId) });
  const likesName = likes.map(async like => { await getUserName(like.authorId) });

  return {
    authorName: authorName,
    comments: commentsName,
    likes: likesName,
    _id: _id,
    pictures: pictures
  };
}

router.get('/:id', async (req, res) => {
  const id = req.params.id;
  if (!validatePostId(id)) {
    return res.status(400).send("bad id")
  }
  const post = await postModel.findOne({ _id: Number(id) });
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
  const post = await postModel.findOne({ _id: Number(id) });
  if (!post) return res.status(404).send("id not exist");

  await postModel.deleteOne({ _id: Number(id) });

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
  console.log(pictures);
  // 이미지를 문자열 주소의 형태로 변환 후 데이터베이스에 등록
  const pictureAddrPromises = uploadImage(pictures.map(picture => picture.filename))
  const pictureAddrs = await Promise.all(pictureAddrPromises);
  console.log(pictureAddrs)

  const post = new postModel({
    pictures: pictureAddrs,
    authorId: (req as any).user.user_id,
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

  const posts = await postModel.find();
  const postsChunk = chunkArray(posts, pageSizeNum);
  console.log(postsChunk[pageNum - 1]);
  const data = await Promise.all(postsChunk[pageNum - 1].map(
    async (post: IPost) => await removeUserIdFromPost(post)
  ))
  return res.json(data)
})

// post로 코멘트 받아서 저장
// req.param으로 postId 받아서 저장
// 변경된 post를 반환
// Request body: { content: string }
router.post('/:id/comment', auth, async (req, res) => {
  const id = req.params.id;
  if (!validatePostId(id)) {
    return res.status(400).send("bad id");
  }
  const post = await postModel.findOne({ _id: Number(id) });
  if (!post) return res.status(404).send("id not exist");

  const { content } = req.body;
  if (content.length <= 0) {
    return res.status(400).send("bad comment");
  }

  const comment: IComment = {
    content,
    likes: [],
    authorId: (req as any).user.id
  };

  post.comments.push(comment);
  await post.save();

  return res.json(await removeUserIdFromPost(post));
});

export default router;