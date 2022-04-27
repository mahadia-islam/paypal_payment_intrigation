const express = require("express");
const paypal = require("paypal-rest-sdk");
const cors = require("cors");

const app = express();
app.use("/", express.static(__dirname + '/public'));
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

paypal.configure({
    mode: "sandbox",
    client_id: "AYPZwaSFMk1DTL4av8uGoXP5MvfMZ5gPXJ0fMt47ZvC5yWb2ANon8lbmwE4b-XfaPhbzVaHsbE0CiMqL",
    client_secret: "EKyUc8rbcrHT6l0HdOp5nMOlHk2c5tUBCx28NFqeMajrHGwlJ9OfV2wFkQPknkwi4smjp1LL0cWVzTXR"
});

app.get("/",(req,res) => res.sendFile(__dirname + "/index.html"));
app.get("/success",(req,res) => res.sendFile(__dirname + "/index.html"));

// payment routes

app.post("/pay", (req, res) => {
    const create_payment_object = {
        intent: "sale",
        payer: {
            "payment_method": "paypal"
        },
        redirect_urls: {
            "return_url": `http://localhost:5000/success/${req.body.price}`,
            "cancel_url": "http://localhost:5000/cancel"
        },
        transactions: [
            {
                "item_list": {
                    "items": [
                        { ...req.body, quantity: 1,currency:"USD" }
                    ]
                },
                "amount": {
                    currency: "USD",
                    total: req.body.price
                },
                "description": "Test Paypal Shop"
            }
        ]
    };

    paypal.payment.create(create_payment_object, (err, payment) => {
        if (err) console.log(err);
        else {
            for (let i = 0; i < payment.links.length; i++) {
                if (payment.links[i].rel === 'approval_url') {
                    res.json({
                        forwardLink:payment.links[i].href
                    })
                }
            }
        }
    });
});

app.get("/success/:price", (req, res) => {
    
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;

    const execute_payment_object = {
        payer_id: payerId,
        transactions: [{
            "amount": {
                currency: "USD",
                total: req.params.price
            }
        }]
    }

    paypal.payment.execute(paymentId, execute_payment_object, (err, payment) => {
        if (err) throw err;
        else {
            res.sendFile(__dirname + "/success.html");
        }
    });

});

app.get('/cancel', (req, res) => res.send('Payment Canceled'));

app.listen(5000, () => {
    console.log("app listening on port 5000");
})