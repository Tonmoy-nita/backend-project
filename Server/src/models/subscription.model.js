import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema({
    subscriber: {
        type: Schema.Types.ObjectId,  // যিনি subscribe করবেন
        ref: "User"  // এটি "User" মডেলের সাথে সংযুক্ত হবে
    },

    channel: {
        type: Schema.Types.ObjectId,  // যিনি subscribe পাবেন (channel owner)
        ref: "User"  // এটি "User" মডেলের সাথে সংযুক্ত হবে
    }
}, { timestamps: true });

// এখানে subscriptionSchema মডেল তৈরি করে export করা হচ্ছে
export const Subscription = mongoose.model("Subscription", subscriptionSchema);
