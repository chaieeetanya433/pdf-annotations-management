exports.uploadPDF = async (req, res) => {
  try {
    const { form_id } = req.body;

    res.json({
      success: true,
      file_url: req.file.path,
      file_id: req.file.filename,
      file_name: req.file.originalname,
      file_size: req.file.size,
      form_id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};