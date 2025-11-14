import { ObjectId } from "mongodb";

class Comment {
  static validate({ user, review, comment }) {
    if (!(user instanceof ObjectId)) {
      throw new TypeError("user must be a valid MongoDB ObjectId");
    }
    if (!(review instanceof ObjectId)) {
      throw new TypeError("review must be a valid MongoDB ObjectId");
    }

    if (typeof comment !== "string") {
      throw new TypeError("comment must be a string");
    }

    return { user, review, comment };
  }

  constructor({ user, review, comment }) {
    const validData = Comment.validate({
      user,
      review,
      comment,
    });
    Object.assign(this, {
      ...validData,
      like: 0,
      dislike: 0,
      createdAt: new Date().toISOString(),
    });
  }
}

export default Comment;

// console.log(
//   new Comment({
//     user: new ObjectId("67e12159b08d6a9c0b597c10"),
//     review: new ObjectId("67e12159b08d6a9c0b597c10"),
//     comment: "Hello mao",
//   })
// );
