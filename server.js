const express = require('express')
const app = express();
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const bcrypt = require('bcryptjs');

const connectDb = require('./db');

const User = require('./models/user');

require('dotenv').config();

connectDb();

// Intialize the middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'Node-app',
    resave: false,
    saveUninitialized: false
}));

// configure passport
app.use(passport.initialize());
app.use(passport.session());

passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
        User.findOne({ email }).then(user => {
            if (!user) {
                return done(null, false, { message: 'Server Error, Invalid credentials' });
            }

            const isMatch = bcrypt.compareSync(password, user.password);

            if (!isMatch) {
                return done(null, false, { message: 'Server Error, Invalid credentials' });
            }

            return done(null, user);
        }).catch(err => {
            return done(null, false, { message: 'Server Error, Invalid credentials' });
        })
    })
);

passport.serializeUser((user, done) => {
    return done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id).then(user => {
        return done(null, user);
    }).catch(err => {
        return done(null, err);
    })
});

app.get('/', function (req, res) {
  res.send('Hello World')
});

app.post('/register', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user) {
            return res.status(401).send('User Already Exists');
        }

        const hashPassord = bcrypt.hashSync(password, 10);

        const newUser = new User({
            email,
            password: hashPassord
        });

        await newUser.save();

        res.status(200).send('User Created Successfully');
    } catch (err) {
        res.status(500).send('Server Error')
    }
});

app.post('/login', passport.authenticate('local', {
    successRedirect: '/success-login',
    failureRedirect: '/failure-login'
}));

app.get('/success-login', (req, res) => {
    if (req.isAuthenticated()) {
        res.status(200).send('User Authenticated');
    } else {
        res.redirect('/failure-login')
    }
})

app.get('/failure-login', (req, res) => {
    res.status(200).send('Login Unsuccessfull. Pls try again later')
});

app.get('/logout', (req, res) => {
    req.logout(err => {
        res.redirect('/failure-login');
    });
})

app.listen(3000);
