const bcrypt = require("bcryptjs");
const User = require("../models/user.model");
const Usage = require("../models/usage.model");

// ========================================
// GET ALL USERS
// ========================================
exports.getAllUsers = async (req, res) => {
  try {
    const company_id = req.user.company_id;

    const { page = 1, limit = 10, search = "", role } = req.query;

    const result = await User.getAllUsers({
      company_id,
      page: Number(page),
      limit: Number(limit),
      search,
      role,
    });

	const parsedLimit = Number(limit);

    res.status(200).json({
      data: result.data,
      pagination: {
        total: result.total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(result.total / parsedLimit)
      },
    });
  } catch (error) {
    console.error("Error getAllUsers:", error);
    res.status(500).json({
      message: "Error interno del servidor",
    });
  }
};

// ========================================
// GET USER BY ID
// ========================================
exports.getUserById = async (req, res) => {
  try {
    const company_id = req.user.company_id;
    const { id } = req.params;

    const user = await User.getUserById(id, company_id);

    if (!user) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error getUserById:", error);
    res.status(500).json({
      message: "Error interno del servidor",
    });
  }
};

// ========================================
// CREATE USER
// ========================================
exports.createUser = async (req, res) => {
  try {
    const company_id = req.user.company_id;

    const { name, email, password, phone, role_id } = req.body;

    if (!name || !email || !password || !role_id) {
      return res.status(400).json({
        message: "Todos los campos obligatorios deben enviarse",
      });
    }

    // Validar si ya existe el email en esta empresa
   	const existing = await User.findByEmailGlobal(email);

    if (existing) {
      return res.status(400).json({
        message: "El correo ya está registrado en esta empresa",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userId = await User.createUser({
      company_id,
      name,
      email,
      password: hashedPassword,
      phone: phone || null,
      role_id,
    });

    // 🔥 Registrar uso mensual
    await Usage.registerUsage(company_id, "users", userId);

    res.status(201).json({
      message: "Usuario creado correctamente",
      userId,
    });
  } catch (error) {
    console.error("Error createUser:", error);
    res.status(500).json({
      message: "Error interno del servidor",
    });
  }
};

// ========================================
// UPDATE USER
// ========================================
exports.updateUser = async (req, res) => {
  try {
    const company_id = req.user.company_id;
    const { id } = req.params;
    const { name, email, phone, role_id } = req.body;

	const affectedRows = await User.updateUser(
		id,
		company_id,
		req.body
	);

    if (!affectedRows) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    res.status(200).json({
      message: "Usuario actualizado correctamente",
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        message: "El correo ya está en uso",
      });
    }
	else{
		console.error("Error updateUser:", error);
		res.status(500).json({
		  message: "Error interno del servidor",
		});
	}
  }
};

// ========================================
// CHANGE PASSWORD
// ========================================
exports.changePassword = async (req, res) => {
  try {
    const company_id = req.user.company_id;
    const { id } = req.params;
    const { new_password } = req.body;

    if (!new_password || new_password.length < 6) {
      return res.status(400).json({
        message: "Contraseña inválida",
      });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);

    const affectedRows = await User.updatePassword(
      id,
      company_id,
      hashedPassword,
    );

    if (!affectedRows) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    res.status(200).json({
      message: "Contraseña actualizada correctamente",
    });
  } catch (error) {
    console.error("Error changePassword:", error);
    res.status(500).json({
      message: "Error interno del servidor",
    });
  }
};

// ========================================
// ACTIVATE / DEACTIVATE USER
// ========================================
exports.toggleUserStatus = async (req, res) => {
  try {
    const company_id = req.user.company_id;
    const { id } = req.params;
    const { status } = req.body;

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({
        message: "Estado inválido",
      });
    }

    // 🔹 Obtener estado actual
    const user = await User.getUserById(id, company_id);

    if (!user) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    const previousStatus = user.status;

    const affectedRows = await User.updateUserStatus(id, company_id, status);

	if (req.user.id === Number(id)) {
		return res.status(400).json({
			message: "No puedes modificar tu propio estado"
		});
	}

    if (!affectedRows) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

	

    // 🔥 Ajustar consumo
    if (previousStatus === "active" && status === "inactive") {
      await Usage.decrementUsage(company_id, "users");
    }

    if (previousStatus === "inactive" && status === "active") {
      await Usage.incrementUsage(company_id, "users");
    }

    res.status(200).json({
      message: "Estado actualizado correctamente",
    });
  } catch (error) {
    console.error("Error toggleUserStatus:", error);
    res.status(500).json({
      message: "Error interno del servidor",
    });
  }
};
