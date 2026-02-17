const pool = require("../config/database");

// ========================================
// CREATE POST
// ========================================
const createPost = async ({
    title,
    content,
    image_url = null,
    platform = "web",
    scheduled_at = null,
    created_by
}) => {

    const [result] = await pool.query(`
        INSERT INTO marketing_posts (
            title,
            content,
            image_url,
            platform,
            scheduled_at,
            created_by
        )
        VALUES (?, ?, ?, ?, ?, ?)
    `, [
        title,
        content,
        image_url,
        platform,
        scheduled_at,
        created_by
    ]);

    return result.insertId;
};


// ========================================
// GET ALL POSTS
// ========================================
const getAllPosts = async () => {

    const [rows] = await pool.query(`
        SELECT 
            mp.*,
            u.name AS created_by_name
        FROM marketing_posts mp
        JOIN users u ON mp.created_by = u.id
        ORDER BY mp.created_at DESC
    `);

    return rows;
};


// ========================================
// FIND POST BY ID
// ========================================
const findPostById = async (id) => {

    const [rows] = await pool.query(`
        SELECT *
        FROM marketing_posts
        WHERE id = ?
    `, [id]);

    return rows.length ? rows[0] : null;
};


// ========================================
// UPDATE POST
// ========================================
const updatePost = async (
    id,
    { title, content, image_url, platform, scheduled_at }
) => {

    const [result] = await pool.query(`
        UPDATE marketing_posts
        SET title = ?,
            content = ?,
            image_url = ?,
            platform = ?,
            scheduled_at = ?
        WHERE id = ?
    `, [
        title,
        content,
        image_url,
        platform,
        scheduled_at,
        id
    ]);

    return result.affectedRows;
};


// ========================================
// PUBLISH POST
// ========================================
const publishPost = async (id) => {

    const [result] = await pool.query(`
        UPDATE marketing_posts
        SET status = 'published',
            published_at = NOW()
        WHERE id = ?
    `, [id]);

    return result.affectedRows;
};


// ========================================
// DELETE POST
// ========================================
const deletePost = async (id) => {

    const [result] = await pool.query(`
        DELETE FROM marketing_posts
        WHERE id = ?
    `, [id]);

    return result.affectedRows;
};


module.exports = {
    createPost,
    getAllPosts,
    findPostById,
    updatePost,
    publishPost,
    deletePost
};