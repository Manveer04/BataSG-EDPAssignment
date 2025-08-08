import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid as Grid,
  MenuItem,
} from "@mui/material";
import { useFormik } from "formik";
import * as yup from "yup";
import http from "../http";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function AddReward() {
  const navigate = useNavigate();
  const [imageFile, setImageFile] = useState(null);

  const formik = useFormik({
    initialValues: {
      name: "",
      description: "",
      pointsNeeded: "",
      tierRequired: "",
    },
    validationSchema: yup.object({
      name: yup
        .string()
        .trim()
        .min(3, "Name must be at least 3 characters")
        .max(100, "Name must be at most 100 characters")
        .required("Name is required"),
      description: yup
        .string()
        .trim()
        .min(3, "Description must be at least 3 characters")
        .max(200, "Description must be at most 200 characters")
        .required("Description is required"),
      pointsNeeded: yup
        .number()
        .min(1, "Points needed must be at least 1")
        .required("Points needed is required"),
      tierRequired: yup
        .string()
        .oneOf(["Bronze", "Silver", "Gold"], "Invalid tier")
        .required("Tier required is required"),
    }),
    onSubmit: (data) => {
      if (imageFile) {
        data.ImageFile = imageFile;
      }

      const formattedData = {
        Name: data.name.trim(),
        Description: data.description.trim(),
        PointsNeeded: data.pointsNeeded,
        TierRequired: data.tierRequired,
        ImageFile: data.ImageFile,
      };

      http
        .post("/reward", formattedData)
        .then((res) => {
          toast.success("Reward added successfully.");
          navigate("/rewards");
        })
        .catch((error) => {
          console.error("Error adding reward:", error.response || error);
          toast.error("Failed to add reward. Please try again.");
        });
    },
  });

  const onFileChange = (e) => {
    let file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        toast.error("Maximum file size is 1MB");
        return;
      }

      let formData = new FormData();
      formData.append("file", file);

      http
        .post("/file/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })
        .then((res) => {
          setImageFile(res.data.filename);
          toast.success("Image uploaded successfully.");
        })
        .catch((error) => {
          console.error("Error uploading image:", error.response || error);
          toast.error("Failed to upload image. Please try again.");
        });
    }
  };

  return (
    <Box sx={{
          marginTop: "100px",
          marginBottom: "50px",
          justifyContent: "center",
          padding: "0",
          marginLeft: "15%",
        }}>
      <ToastContainer />
      
      <Typography variant="h5" sx={{ my: 2 }}>
        Add Reward
      </Typography>
      <Box component="form" onSubmit={formik.handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6} lg={8}>
            <TextField
              fullWidth
              margin="dense"
              autoComplete="off"
              label="Name"
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
            />
            <TextField
              fullWidth
              margin="dense"
              autoComplete="off"
              multiline
              minRows={2}
              label="Description"
              name="description"
              value={formik.values.description}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.description && Boolean(formik.errors.description)
              }
              helperText={
                formik.touched.description && formik.errors.description
              }
            />
            <TextField
              fullWidth
              margin="dense"
              autoComplete="off"
              type="number"
              label="Points Needed"
              name="pointsNeeded"
              value={formik.values.pointsNeeded}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.pointsNeeded &&
                Boolean(formik.errors.pointsNeeded)
              }
              helperText={
                formik.touched.pointsNeeded && formik.errors.pointsNeeded
              }
            />
            <TextField
              fullWidth
              margin="dense"
              autoComplete="off"
              select
              label="Tier Required"
              name="tierRequired"
              value={formik.values.tierRequired}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.tierRequired &&
                Boolean(formik.errors.tierRequired)
              }
              helperText={
                formik.touched.tierRequired && formik.errors.tierRequired
              }
            >
              {["Bronze", "Silver", "Gold"].map((tier) => (
                <MenuItem key={tier} value={tier}>
                  {tier}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <Box sx={{ textAlign: "center", mt: 2 }}>
              <Button variant="contained" component="label">
                Upload Image
                <input
                  hidden
                  accept="image/*"
                  type="file"
                  onChange={onFileChange}
                />
              </Button>
              {imageFile && (
                <Box sx={{ mt: 2 }}>
                  <img
                    alt="reward"
                    src={`${import.meta.env.VITE_FILE_BASE_URL}${imageFile}`}
                    style={{ maxWidth: "100%", maxHeight: "200px" }}
                  />
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
        <Box sx={{ mt: 2 }}>
          <Button variant="contained" type="submit">
            Add
          </Button>
        </Box>
      </Box>

      <ToastContainer />
    </Box>
  );
}

export default AddReward;