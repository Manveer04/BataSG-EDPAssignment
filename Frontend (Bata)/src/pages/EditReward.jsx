import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, TextField, Button, Grid, MenuItem } from '@mui/material';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import http from '../http';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function EditReward() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [reward, setReward] = useState({
        name: "",
        description: "",
        pointsNeeded: "",
        tierRequired: "",
    });
    const [imageFile, setImageFile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [rewardFound, setRewardFound] = useState(true);

    // Fetch reward details
    useEffect(() => {
        http.get(`/reward/${id}`)
            .then((res) => {
                setReward(res.data);
                setImageFile(res.data.imageFile);
                setLoading(false);
                setRewardFound(true); // Reward found
            })
            .catch((err) => {
                console.error(err);
                setRewardFound(false); // Reward not found
                setLoading(false);
            });
    }, [id]);

    // Form validation schema
    const formik = useFormik({
        initialValues: {
            ...reward,
            imageFile: imageFile,
        },
        enableReinitialize: true,
        validationSchema: yup.object({
            name: yup.string().trim()
                .min(3, 'Name must be at least 3 characters')
                .max(100, 'Name must be at most 100 characters')
                .required('Name is required'),
            description: yup.string().trim()
                .min(3, 'Description must be at least 3 characters')
                .max(200, 'Description must be at most 200 characters')
                .required('Description is required'),
            pointsNeeded: yup.number()
                .min(1, 'Points needed must be at least 1')
                .required('Points needed is required'),
            tierRequired: yup.string()
                .oneOf(['Bronze', 'Silver', 'Gold'], 'Invalid tier')
                .required('Tier required is required'),
        }),
        onSubmit: (data) => {
            data.imageFile = imageFile;
            data.name = data.name.trim();
            data.description = data.description.trim();

            http.put(`/reward/${id}`, data)
                .then(() => {
                    toast.success('Reward updated successfully!');
                    navigate("/rewards", { replace: true });
                })
                .catch((err) => {
                    console.error(err);
                    toast.error("Failed to update reward");
                });
        },
    });

    const onFileChange = (e) => {
        let file = e.target.files[0];
        if (file) {
            if (file.size > 1024 * 1024) {
                toast.error('Maximum file size is 1MB');
                return;
            }

            let formData = new FormData();
            formData.append('file', file);
            http.post('/file/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            })
                .then((res) => {
                    setImageFile(res.data.filename);
                    formik.setFieldValue("imageFile", res.data.filename);
                })
                .catch((err) => {
                    console.error(err.response);
                    toast.error("Failed to upload image");
                });
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        formik.setFieldValue("imageFile", null);
        toast.info('Image removed successfully');
    };

    const [open, setOpen] = useState(false);

    const handleOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const deleteReward = () => {
        http.delete(`/reward/${id}`)
            .then(() => {
                toast.success('Reward deleted successfully!');
                navigate("/rewards");
            })
            .catch((err) => {
                console.error(err);
                toast.error("Failed to delete reward");
            });
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
                Edit Reward
            </Typography>
            
            {!loading ? (
                rewardFound ? (
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
                                    error={formik.touched.description && Boolean(formik.errors.description)}
                                    helperText={formik.touched.description && formik.errors.description}
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
                                    error={formik.touched.pointsNeeded && Boolean(formik.errors.pointsNeeded)}
                                    helperText={formik.touched.pointsNeeded && formik.errors.pointsNeeded}
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
                                    error={formik.touched.tierRequired && Boolean(formik.errors.tierRequired)}
                                    helperText={formik.touched.tierRequired && formik.errors.tierRequired}
                                >
                                    {['Bronze', 'Silver', 'Gold'].map((tier) => (
                                        <MenuItem key={tier} value={tier}>
                                            {tier}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={6} lg={4}>
                                <Box sx={{ textAlign: 'center', mt: 2 }}>
                                    <Button variant="contained" component="label">
                                        Upload Image
                                        <input hidden accept="image/*" type="file" onChange={onFileChange} />
                                    </Button>
                                    {imageFile && (
                                        <Box sx={{ mt: 2 }}>
                                            <img
                                                alt="reward"
                                                src={`${import.meta.env.VITE_FILE_BASE_URL}${imageFile}`}
                                                style={{ width: '100%', maxHeight: 200, objectFit: 'cover' }}
                                            />
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                sx={{ mt: 1 }}
                                                onClick={handleRemoveImage}
                                            >
                                                Remove Image
                                            </Button>
                                        </Box>
                                    )}
                                </Box>
                            </Grid>
                        </Grid>
                        <Box sx={{ mt: 2 }}>
                            <Button variant="contained" type="submit">
                                Update
                            </Button>
                            <Button variant="contained" sx={{ ml: 2 }} color="error" onClick={handleOpen}>
                                Delete
                            </Button>
                        </Box>
                    </Box>
                ) : (
                    <Box>
                        <Typography variant="h6" color="error">
                            Reward not found.
                        </Typography>
                        <Button variant="contained" onClick={() => navigate("/rewards")}>
                            Go back to Rewards
                        </Button>
                    </Box>
                )
            ) : (
                <Typography>Loading...</Typography>
            )}

            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>Delete Reward</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this reward?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button variant="contained" color="inherit" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button variant="contained" color="error" onClick={deleteReward}>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            <ToastContainer />
        </Box>
    );
}

export default EditReward;
