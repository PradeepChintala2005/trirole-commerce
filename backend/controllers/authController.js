const bcrypt = require('bcrypt');
const { sendSuccess, sendError } = require('../utils/response');
const { generateToken } = require('../middleware/authMiddleware');

const register = async (req, res, next) => {
    // Normal registration for the Storefront creates a Customer
    const { username, password, email, name } = req.body;
    if (!username || !password) return sendError(res, 400, 'Username and password required');

    try {
        await req.db.exec('BEGIN TRANSACTION');
        
        const hash = await bcrypt.hash(password, 10);
        
        // 1. Create native User
        const userResult = await req.db.run(
            'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', 
            [username, hash, 'customer']
        );
        const userId = userResult.lastID;

        // 2. Create linked Customer Profile if applicable
        await req.db.run(
            'INSERT INTO customers (user_id, name, email) VALUES (?, ?, ?)',
            [userId, name || username, email || `${username}@mail.com`]
        );

        await req.db.exec('COMMIT');
        return sendSuccess(res, { id: userId, username, role: 'customer' }, 'Customer account created', 201);
    } catch (err) {
        try{
            await req.db.exec('ROLLBACK');
        }
        catch(e){
            console.log("Rollback skipped:",e.message)
        }
        if (err.message.includes('UNIQUE constraint failed')) {
            return sendError(res, 400, 'Username or Email already exists');
        }
        next(err);
    }
};

const login = async (req, res, next) => {
    const { username, password } = req.body;
    if (!username || !password) return sendError(res, 400, 'Username and password required');

    try {
        const user = await req.db.get('SELECT * FROM users WHERE username = ?', [username]);
        if (!user) return sendError(res, 401, 'Invalid credentials');

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return sendError(res, 401, 'Invalid credentials');

        const token = generateToken(user);
        return sendSuccess(res, { 
            token, 
            user: { id: user.id, username: user.username, role: user.role } 
        }, 'Login successful');
    } catch (err) {
        next(err);
    }
};

const getMe = async (req, res, next) => {
    try {
        const user = await req.db.get('SELECT id, username, role, created_at FROM users WHERE id = ?', [req.user.id]);
        if (!user) return sendError(res, 404, 'User not found');
        return sendSuccess(res, user, 'Profile fetched');
    } catch (err) {
        next(err);
    }
};

// =======================
// ADMIN USER MANAGEMENT
// =======================
const getUsers = async (req, res, next) => {
    try {
        const users = await req.db.all('SELECT id, username, role, created_at FROM users ORDER BY created_at DESC');
        sendSuccess(res, users, 'Users fetched');
    } catch (err) { next(err); }
};

const createUser = async (req, res, next) => {
    // Admin forcibly creating Staff or Admins
    const { username, password, role } = req.body;
    if (!username || !password || !role) return sendError(res, 400, 'Username, password, and role required');
    if (!['admin', 'staff', 'customer'].includes(role)) return sendError(res, 400, 'Invalid role');

    try {
        const hash = await bcrypt.hash(password, 10);
        const result = await req.db.run(
            'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', 
            [username, hash, role]
        );
        return sendSuccess(res, { id: result.lastID, username, role }, 'User forcefully created', 201);
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
            return sendError(res, 400, 'Username already exists');
        }
        next(err);
    }
};

const deleteUser = async (req, res, next) => {
    try {
        // Prevent deleting yourself
        if (parseInt(req.params.id) === req.user.id) {
            return sendError(res, 400, 'Cannot delete your own admin account');
        }
        await req.db.run('DELETE FROM users WHERE id = ?', [req.params.id]);
        sendSuccess(res, null, 'User deleted');
    } catch(err) { next(err); }
}

module.exports = { register, login, getMe, getUsers, createUser, deleteUser };
