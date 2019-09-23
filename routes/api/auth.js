const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const config = require('config');
const bcrypt = require('bcryptjs');

const User = require('../../models/User');

// @route   GET api/auth 
// @desc    Test route 
// @access  Public
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
    
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(401).send('Server Error');
    }
});

// @route   POST api/auth
// @desc    Authenticate user & get token 
// @access  Public
router.post('/', [
    // Validate user inputs
    check('email', 'Invalid email, please try again').isEmail(),
    check('password', 'Password is required').exists()
], async (req, res) => {
        //Check if there is any invalid input (error)
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        try {
            // Check the email is is correct
            let user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });   
            }

            // Check if the password is correct
            const isMatch = await bcrypt.compare(password, user.password);
            
            if (!isMatch) {
                return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
            }

            // Return jsonwebtoken
            const payload = {
                user: {
                    id: user.id
                }
            }

            jwt.sign(
                payload,
                config.get('jwtSecret'),
                { expiresIn: 360000 },
                (err, token) => {
                if (err) throw err 
                    res.json({ token });
                }
            );
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }
});

module.exports = router;