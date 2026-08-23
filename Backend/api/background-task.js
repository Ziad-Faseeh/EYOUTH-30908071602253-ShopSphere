module.exports = (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Background workload executed via Serverless Function",
    timestamp: new Date().toISOString()
  });
};