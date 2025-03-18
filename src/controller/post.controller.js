import {
  API_ERROR,
  API_Response,
  asyncHandler,
  cloudinaryFileUpload,
} from "../utils/index.js";
import {Post} from "../model/post.model.js"

const postCreation = asyncHandler(async (req, res, next) => {
  const {
    title, slug, content, excerpt, status, tags, seo, isFeatured, category
  } = req.body;

  console.log(req.files);


  if (!title || !slug || !content || !category || !req.files || req?.files?.length === 0) {
    throw new API_ERROR("Missing required fields", 400, {
      errorCode: "missing_fields",
      path: req.originalUrl,
      validationErrors: [
        ...(!title ? [{ field: "title", message: "Title is required" }] : []),
        ...(!slug ? [{ field: "slug", message: "Slug is required" }] : []),
        ...(!content ? [{ field: "content", message: "Content is required" }] : []),
        ...(!req.files && req?.files?.length == 0 ? [{ field: "featuredImage", message: "At least one image is required" }] : []),
        ...(!category ? [{ field: "category", message: "Category is required" }] : []),
      ],
    });
  }

  console.log("Hello world!");

  const existingPost = await Post.findOne({ $or: [{ title }, { slug }] });

  if (existingPost) {
    throw new API_ERROR("A post with the same title or slug already exists", 409, {
      errorCode: "duplicate_post_title_or_slug",
      path: req.originalUrl,
      cause: "A post with the same title or slug already exists in the database",
    });
  }


  const uploadedImages = await Promise.all(
    req.files.map(async (image) => {
      const uploadedImage = await cloudinaryFileUpload(image?.path)

      return {
        url: uploadedImage?.secure_url,
        altText: image?.originalname.length > 125
        ? image.originalname.substring(0, 120)
        : image.originalname,

        credit: "User Upload",
      };
    })
  );



  const newPost = await Post.create({
    title,
    slug,
    content,
    excerpt,
    status,
    tags,
    featuredImages: uploadedImages,
    seo,
    isFeatured,
    category,
  });

  if (!newPost) {
    throw new API_ERROR("Failed to create post", 500, {
      errorCode: "failed_to_create_post",
      path: req.originalUrl,
      cause: "Failed to create a new post in the database",
    });
  }


  return res.status(201).json(API_Response.success(newPost, {
    statusCode: 201,
    message: "Post created successfully",
    path: req.originalUrl,
  }));
});



export {
  postCreation,

 };


