import express from "express";
import axios from "axios";

const authRouter = express.Router();

authRouter.use(express.json());
authRouter.use(express.urlencoded({ extended: false }));

authRouter.post("/", async (req, res) => {
    const auth_code = req.body.code;

    axios.post('https://api.line.me/oauth2/v2.1/token', {
        grant_type: 'authorization_code',
        code: auth_code,
        'data-urlencode': true,
        redirect_uri: 'https://linebotfront-ochre.vercel.app/redirect',
        client_id: '1661123199',
        client_secret: '6495e44cca48336ff0ff0fd236bb1add'
    }, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })
        .then((response) => {
            const idToken = response.data.id_token;
            const accessToken = response.data.access_token;
            const refreshToken = response.data.refresh_token;

            axios.post('https://api.line.me/oauth2/v2.1/verify', {
                id_token: idToken,
                client_id: '1661123199'
            }, {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            })
                .then((resp) => {
                    res.status(200).json({
                        id_token: idToken,
                        access_token: accessToken,
                        refresh_token: refreshToken,
                        sub: resp.data.sub,
                        name: resp.data.name,
                        picture: resp.data.picture,
                        email: resp.data.email
                    })
                })
                .catch((error) => {
                    console.error(error);
                });
        })
        .catch((error) => {
            console.error(error);
        })
});

authRouter.use("/getData", (req, res) => {
    const idToken = req.body.idToken;
    const accessToken = req.body.accessToken;
    const refreshToken = req.body.refreshToken;
})

export default authRouter;