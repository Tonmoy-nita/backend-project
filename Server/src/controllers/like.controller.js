import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    const likedAlready = await Like.findOne({
        video: videoId,
        likedBy: req.user?._id
    });

    if (likedAlready) {
        await Like.findByIdAndDelete(likedAlready?._id);

        return res
            .status(200)
            .json(new ApiResponse(200, {isLiked: false}, "Like removed successfully"));
    }

    await Like.create({
        video: videoId,
        likedBy: req.user?._id,
        type: "like"
    });

    return res
        .status(200)
        .json(new ApiResponse(200, {isLiked: true}, "Like added successfully"));
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid commentId");
    }

    const likedAlready = await Like.findOne({
        comment: commentId,
        likedBy: req.user?._id
    });

    if (likedAlready) {
        await Like.findByIdAndDelete(likedAlready?._id);

        return res
            .status(200)
            .json(new ApiResponse(200, {isLiked: false}, "Like removed successfully"));
    }

    await Like.create({
        comment: commentId,
        likedBy: req.user?._id,
        type: "like"
    });

    return res
        .status(200)
        .json(new ApiResponse(200, {isLiked: true}, "Like added successfully"));
})

const toggleVideoDislike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle dislike on video

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    const dislikedAlready = await Like.findOne({
        video: videoId,
        likedBy: req.user?._id,
        type: "dislike"
    });

    if (dislikedAlready) {
        await Like.findByIdAndDelete(dislikedAlready?._id);

        return res
            .status(200)
            .json(new ApiResponse(200, {isDisliked: false}, "Dislike removed successfully"));
    }

    // Remove like if exists
    await Like.findOneAndDelete({
        video: videoId,
        likedBy: req.user?._id,
        type: "like"
    });

    await Like.create({
        video: videoId,
        likedBy: req.user?._id,
        type: "dislike"
    });

    return res
        .status(200)
        .json(new ApiResponse(200, {isDisliked: true}, "Dislike added successfully"));
})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos

    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user?._id),
                type: "like",
                video: { $exists: true }
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        fullName: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $unwind: "$owner"
                    },
                    {
                        $project: {
                            videoFile: 1,
                            thumbnail: 1,
                            title: 1,
                            description: 1,
                            duration: 1,
                            views: 1,
                            owner: 1,
                            createdAt: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$video"
        },
        {
            $sort: {
                createdAt: -1
            }
        }
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, likedVideos, "Liked videos fetched successfully"));
})

export {
    getLikedVideos, toggleCommentLike, toggleVideoDislike, toggleVideoLike
}
