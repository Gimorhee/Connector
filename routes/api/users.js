const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');

const User = require('../../models/User');

// @route   POST api/users
// @desc    Register user 
// @access  Public
router.post('/', [
    // Validate user inputs
    check('name', 'Invalid name, please try again.').not().isEmpty(),
    check('email', 'Invalid email, please try again').isEmail(),
    check('password', 'Invalid password, please try again').isLength({ min: 8 })
], async (req, res) => {
        //Check if there is any invalid input (error)
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password } = req.body;

        try {
            // Check if your email already exists through email
            let user = await User.findOne({ email });
            if (user) {
                return res.status(400).json({ errors: [{ msg: 'User already exists, please try again' }] });   
            }

            // Get user gravatar
            const avatar = gravatar.url(email, {
                s: '200', // Size
                r: 'pg', // Rating
                d: 'mm'// Default
            });

            user = new User({
                name,
                email,
                password,
                avatar
            });

            // Encrypt password
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);

            await user.save()

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