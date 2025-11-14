import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import verifyOrigin from "../middlewares/allowOrigin.middleware.js";
import verifyJWTToken from "../middlewares/firebase.jwt.middleware.js";

import { createOne, find, findOne } from "../utils/mongodbCRUD.js";
import { ObjectId } from "mongodb";
import connectDB from "../connections/mongodb.connection.js";

import Comment from "../models/comment.model.js";
import Review from "../models/review.model.js";
import User from "../models/user.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mockDataPath = path.join(__dirname, "../utils/MOCK_DATA.json");
const mockData = JSON.parse(fs.readFileSync(mockDataPath, "utf-8"));

const router = express.Router();

router.get("/", (req, res) => {
  return res.status(200).json({
    message: "hello api_route",
  });
});

router.get("/data", verifyOrigin, (req, res) => {
  return res.status(200).json(mockData);
});

// router.post("/add-data", verifyOrigin, async (req, res) => {
//   const data = await createFood({
//     ...req.body,
//     name: "gele-bi",
//     createdAt: Date.now(),
//   });

//   return res.status(200).send(data);
// });

router.get("/secure-data", verifyOrigin, verifyJWTToken, (req, res) => {
  return res.status(200).json(mockData);
});

router.get("/data/:id", verifyOrigin, verifyJWTToken, (req, res) => {
  const { id } = req.params;

  console.log("id ==> ", id);
  return res.status(200).json(mockData);
});

export default router;

router.get("/home-data", verifyOrigin, async (req, res, next) => {
  try {
    const reviews = await find({
      data: {},
      collectionName: "reviews",
    });

    for (let review of reviews) {
      let user = await findOne({
        data: {
          _id: new ObjectId(review.user),
        },
        collectionName: "users",
      });

      review.user = user;
    }

    return res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/home-others-data", verifyOrigin, async (req, res, next) => {
  try {
    const responseReviewers = await find({
      data: {},
      collectionName: "top_reviewers",
    });

    const responseFeedbacks = await find({
      data: {},
      collectionName: "feedbacks",
    });

    return res.status(200).json({
      success: true,
      topReviewers: responseReviewers,
      usersFeedback: responseFeedbacks,
    });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/create/user",
  verifyOrigin,
  verifyJWTToken,
  async (req, res, next) => {
    try {
      // const {displayName, email, photoURL} = req.body;
      const { name, email, image } = req.body;

      const checkedUser = await findOne({
        data: {
          name,
          email,
        },
        collectionName: "users",
      });

      if (checkedUser) {
        return res.status(300).json({
          success: false,
          message: "user Already exist",
        });
      }

      const schema = {
        name,
        email,
        image,
      };
      const createdUser = await createOne({
        data: new User(schema),
        collectionName: "users",
      });

      console.log("createdUser ===> ", createdUser);

      return res.status(201).json({
        success: true,
        message: "user created successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/create/review",
  verifyOrigin,
  verifyJWTToken,
  async (req, res, next) => {
    try {
      // const {displayName, email, photoURL} = req.body;
      const {
        name,
        email,
        foodName,
        image,
        category,
        ratings,
        restaurantName,
        location,
        reviewText,
      } = req.body;

      const checkedUser = await findOne({
        data: {
          name,
          email,
        },
        collectionName: "users",
      });

      // console.log("checkedUser == ", checkedUser);

      const schema = {
        user: checkedUser._id,
        foodName,
        image,
        category,
        ratings,
        restaurantName,
        location,
        reviewText,
      };

      const createdReviews = await createOne({
        data: new Review(schema),
        collectionName: "reviews",
      });

      console.log("createdReviews ===> ", createdReviews);

      return res.status(201).json({
        success: true,
        message: "Review created!",
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post("/create/comment", async (req, res, next) => {
  try {
    let { name, email, reviewId, comment } = req.body;

    name: name.trim();
    email: email.trim();
    comment: comment.trim();

    if (!name || !email || !comment || !reviewId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const user = await findOne({
      data: { name, email },
      collectionName: "users",
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const createdComment = await createOne({
      data: new Comment({
        user: new ObjectId(user._id),
        review: new ObjectId(reviewId),
        comment,
      }),
      collectionName: "comments",
    });

    return res.status(201).json({
      success: true,
      message: "comment created!",
    });
  } catch (error) {
    next(error);
  }
});

router.put("/update/user", async (req, res, next) => {
  try {
    let { name, email, image } = req.body;

    name = name.trim();
    email = email.trim();
    image = image.trim();

    if (!name || !email || !image) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, email, and image are required",
      });
    }

    const user = await findOne({
      data: { name, email },
      collectionName: "users",
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const db = await connectDB();

    // 4️⃣ Replace user fields
    const updateResult = await db.collection("users").updateOne(
      { _id: new ObjectId(user._id) }, // filter by unique _id
      {
        $set: {
          name,
          email,
          image,
          updatedAt: new Date().toISOString(), // optional: track updates
        },
      }
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(400).json({
        success: false,
        message: "User update failed",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: {
        _id: user._id,
        name,
        email,
        image,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/shows/all-comments", async (req, res, next) => {
  const { reviewId } = req.query;

  if (!reviewId) {
    return res.status(300).json({
      success: false,
      message: reviewId,
    });
  }

  const comments = await find({
    data: {
      review: new ObjectId(reviewId),
    },
    collectionName: "comments",
  });

  console.log("comments ===> ", comments);

  for (let comment of comments) {
    let user = await findOne({
      data: { _id: new ObjectId(comment.user) },
      collectionName: "users",
    });
    comment.user = user;
  }

  return res.status(200).json({
    success: true,
    data: comments,
  });
});

router.get("/shows/all-reviews", verifyOrigin, async (req, res, next) => {
  try {
    const reviews = await find({
      data: {},
      collectionName: "reviews",
    });

    for (let review of reviews) {
      let user = await findOne({
        data: {
          _id: new ObjectId(review.user),
        },
        collectionName: "users",
      });

      review.user = user;
    }

    return res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/shows/my-reviews", async (req, res, next) => {
  let { name, email } = req.query;

  name: name.trim();
  email: email.trim();

  try {
    const user = await findOne({
      data: {
        name,
        email,
      },
      collectionName: "users",
    });

    const reviews = await find({
      data: {
        user: new ObjectId(user._id),
      },
      collectionName: "reviews",
    });
    return res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/shows/loved-reviews", async (req, res, next) => {
  try {
    let { name, email } = req.query;

    name: name.trim();
    email: email.trim();

    const user = await findOne({
      data: {
        name,
        email,
      },
      collectionName: "users",
    });

    if (!user) {
      return res.status(200).json({
        success: false,
        message: "user not exist!",
      });
    }

    const reviews = await find({
      data: {
        loved: new ObjectId(user._id),
      },
      collectionName: "reviews",
    });
    return res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/add/loved-reviews", async (req, res, next) => {
  try {
    let { name, email, reviewId } = req.body;

    name: name.trim();
    email: email.trim();

    const user = await findOne({
      data: { name, email },
      collectionName: "users",
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const db = await connectDB();

    const updateResult = await db
      .collection("reviews")
      .updateOne(
        { _id: new ObjectId(reviewId), user: new ObjectId(user._id) },
        { $addToSet: { loved: new ObjectId(user._id) } }
      );

    if (updateResult.modifiedCount === 0) {
      return res.status(400).json({
        success: false,
        message: "No review updated (maybe already loved or invalid reviewId)",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Review added to loved list successfully",
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/remove/loved-reviews", async (req, res, next) => {
  try {
    let { name, email, reviewId } = req.body;

    name: name.trim();
    email: email.trim();

    const user = await findOne({
      data: { name, email },
      collectionName: "users",
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const db = await connectDB();

    // 3️⃣ Remove user ObjectId from loved array
    const updateResult = await db.collection("reviews").updateOne(
      { _id: new ObjectId(reviewId), user: new ObjectId(user._id) },
      { $pull: { loved: new ObjectId(user._id) } } // <-- use $pull instead of $addToSet
    );

    // 4️⃣ Check if anything was updated
    if (updateResult.matchedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    }

    if (updateResult.modifiedCount === 0) {
      return res.status(400).json({
        success: false,
        message: "User was not in loved list or review already updated before.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User removed from loved list successfully",
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/remove/reviews", async (req, res, next) => {
  try {
    let { name, email, reviewId } = req.body;

    name: name.trim();
    email: email.trim();

    if (!name || !email || !reviewId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const user = await findOne({
      data: { name, email },
      collectionName: "users",
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const db = await connectDB();

    const deleteResult = await db.collection("reviews").deleteOne({
      _id: new ObjectId(reviewId),
      user: new ObjectId(user._id),
    });

    if (deleteResult.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Review not found or not owned by this user",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    next(error);
  }
});
