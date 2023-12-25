import express from "express";
import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
    sub: {
        type: String,
        required: true,
    },
    name: {
        type: String,
    },
    email: {
        type: String,
    },
    pic: {
        type: String
    },
    date: {
        type: Date,
        default: Date.now,
    },
    prompt: {
        type: String,
    },
    history: {
        type: String
    },
    biography: {
        type: String
    }
});

const ChatSchema = mongoose.model("history_enquiry", chatSchema);

const historyRouter = express.Router();
historyRouter.use(express.json());
historyRouter.use(express.urlencoded({ extended: false }));

const set = async (key, value) => {

    const result = await ChatSchema.findOne({ sub: key });

    const filter = { sub: key };

    const update = { $set: { history: value } };

    const { updatedResult, err } = await ChatSchema.updateOne(filter, update);
    if (result) console.log("updated");
    else console.log(err);
}

const setBiography = async (key, biography) => {
    const result = await ChatSchema.findOne({ sub: key });
    const filter = { sub: key };
    const update = { $set: { biography: result.biography + biography + '\n' } };
    try {
        await ChatSchema.updateOne(filter, update);
    } catch (e) {
        console.log(err);
    }
}

const get = async (key) => {
    const result = await ChatSchema.findOne({ sub: key });
    if (!result) return false;
    return result.history
}

const isNewUser = async (key) => {
    const result = await ChatSchema.findOne({ sub: key });
    if (!result) return true;
    return false;
}

const cleanUser = async (key) => {
    try {
        const filter = { sub: key };
        const result = await ChatSchema.deleteOne(filter);
        console.log("successfully deleted!");
    }catch(e){
        console.log("an error occured: ", e);
    }
}

const saveNewUser = async (_sub, _name, _picture, _email) => {
    const newUserHistory = new ChatSchema({
        sub: _sub,
        name: _name,
        picture: _picture,
        email: _email,
        pic: "",
        prompt: "",
        history: "",
        biography: ""
    })

    const { result, err } = await newUserHistory.save();
    if (result) console.log("success");
    else console.log(err);
}
historyRouter.get("/getBiography", async (req, res) => {
    const key = req.query.sub;
    const result = await ChatSchema.findOne({ sub: key });
    if (!result) return res.status(201).json({ "error": "Not found!" });
    return res.status(200).json({ "msg": result.biography });
})

historyRouter.post("/updateBiography", async (req, res) => {
    const key = req.body.sub;
    const value = req.body.bio;

    const filter = { sub: key };
    const update = { $set: { biography: value } };

    try {
        const updatedResult = await ChatSchema.updateOne(filter, update);
        return res.status(200).json({ "msg": "okay" });
    } catch (e) {
        console.log(e);
    }
})
export { set, get, setBiography, historyRouter, isNewUser, saveNewUser, cleanUser };