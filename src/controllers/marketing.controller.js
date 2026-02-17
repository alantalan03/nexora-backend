const Marketing = require("../models/marketing.model");

// ========================================
// CREATE POST
// ========================================
exports.createPost = async (req, res) => {
    try {

        const { title, content, image_url, platform, scheduled_at } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                message: "Título y contenido son requeridos"
            });
        }

        const postId = await Marketing.createPost({
            title,
            content,
            image_url,
            platform,
            scheduled_at,
            created_by: req.user.id
        });

        res.status(201).json({
            message: "Publicación creada como borrador",
            postId
        });

    } catch (error) {
        console.error("Error createPost:", error);
        res.status(500).json({
            message: "Error interno"
        });
    }
};


// ========================================
// GET ALL POSTS
// ========================================
exports.getAllPosts = async (req, res) => {
    try {

        const posts = await Marketing.getAllPosts();

        res.status(200).json(posts);

    } catch (error) {
        console.error("Error getAllPosts:", error);
        res.status(500).json({
            message: "Error interno"
        });
    }
};


// ========================================
// UPDATE POST
// ========================================
exports.updatePost = async (req, res) => {
    try {

        const { id } = req.params;
        const { title, content, image_url, platform, scheduled_at } = req.body;

        const affectedRows = await Marketing.updatePost(id, {
            title,
            content,
            image_url,
            platform,
            scheduled_at
        });

        if (!affectedRows) {
            return res.status(404).json({
                message: "Publicación no encontrada"
            });
        }

        res.status(200).json({
            message: "Publicación actualizada"
        });

    } catch (error) {
        console.error("Error updatePost:", error);
        res.status(500).json({
            message: "Error interno"
        });
    }
};


// ========================================
// PUBLISH POST
// ========================================
exports.publishPost = async (req, res) => {
    try {

        const { id } = req.params;

        const affectedRows = await Marketing.publishPost(id);

        if (!affectedRows) {
            return res.status(404).json({
                message: "Publicación no encontrada"
            });
        }

        res.status(200).json({
            message: "Publicación marcada como publicada"
        });

    } catch (error) {
        console.error("Error publishPost:", error);
        res.status(500).json({
            message: "Error interno"
        });
    }
};


// ========================================
// DELETE POST
// ========================================
exports.deletePost = async (req, res) => {
    try {

        const { id } = req.params;

        const affectedRows = await Marketing.deletePost(id);

        if (!affectedRows) {
            return res.status(404).json({
                message: "Publicación no encontrada"
            });
        }

        res.status(200).json({
            message: "Publicación eliminada"
        });

    } catch (error) {
        console.error("Error deletePost:", error);
        res.status(500).json({
            message: "Error interno"
        });
    }
};