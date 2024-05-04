import React, { useState } from 'react';
import { Form, Input, message, Modal, Button, Row, Typography } from 'antd';
import { UploadOutlined, DeleteOutlined, LogoutOutlined, LoadingOutlined } from '@ant-design/icons';
import Me from '../api/Me';
import UserAvatar from '../components/UserAvatar';
import Auth from '../api/Auth';

const ProfilePage: React.FC<{ me: Me; setSidabarAvatarKey: React.Dispatch<React.SetStateAction<number>> }> = ({ me, setSidabarAvatarKey }) => {
    const [nameEdit, setNameEdit] = useState<string>(me.name);
    const [passwordModalVisible, setPasswordModalVisible] = useState(false);
    const [newPassword, setNewPassword] = useState<string | null>(null);
    const [hover, setHover] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState<string | null>(null);
    const [form] = Form.useForm(); // Form hook
    const [uploading, setUploading] = useState<boolean>(false)
    const [avatarKey, setAvatarKey] = useState<number>(1);

    // Handle password change
    const handlePasswordChange = async () => {
        try {
            // Validate form fields
            await form.validateFields();
            // If both passwords are null, no change is intended
            if (newPassword === null && confirmPassword === null) {
                setPasswordModalVisible(false);
                return;
            }
            // Call API to update password
            if (newPassword !== confirmPassword) {
                message.error('Passwords do not match');
                return;
            }
            const success = await me.update_me(null, newPassword);
            if (success) {
                message.success('Password changed successfully');
                setPasswordModalVisible(false);
                setNewPassword(null);
                setConfirmPassword(null);
            } else {
                message.error('Failed to change password');
            }
        } catch (error) {
            console.error('Error updating password:', error);
            message.error('Failed to change password');
        }
    };

    // Handle avatar upload
    const handleAvatarUpload = async (file: File) => {
        setUploading(true)
        setHover(false)
        try {
            const success = await Me.upload_avatar(file);
            if (success) {
                message.success('Avatar uploaded successfully');
                setAvatarKey(avatarKey+1)
                setSidabarAvatarKey(avatarKey+1)
                // You may want to refresh the avatar displayed after successful upload
            } else {
                message.error('Failed to upload avatar');
            }
        } catch (error) {
            console.error('Error uploading avatar:', error);
            message.error('Failed to upload avatar');
        }
        setUploading(false)
    };

    // Handle avatar deletion
    const handleAvatarDelete = async () => {
        setHover(false)
        try {
            const success = await Me.delete_avatar();
            if (success) {
                message.success('Avatar deleted successfully');
                setAvatarKey(avatarKey+1)
                setSidabarAvatarKey(avatarKey+1)
                // You may want to refresh the avatar displayed after successful deletion
            } else {
                message.error('Failed to delete avatar');
            }
        } catch (error) {
            console.error('Error deleting avatar:', error);
            message.error('Failed to delete avatar');
        }
    };

    const handleLogout = async () => {
        await Auth.logout()
        window.location.href = "/login"
    };

    const handleNameBlur = async () => {
        if (nameEdit !== me.name) {
            if(nameEdit.length >= 1){
                if(nameEdit.length <= 32){
                    if(/\S/.test(nameEdit)){
                        try {
                            const success = await me.update_me(nameEdit);
                            if (success) {
                                message.success('Name updated successfully');
                            } else {
                                message.error('Username already in use.');
                                // Revert back to previous name on failure
                                setNameEdit(me.name);
                            }
                        } catch (error) {
                            console.error('Error updating name:', error);
                            message.error('Failed to update name');
                            // Revert back to previous name on error
                            setNameEdit(me.name);
                        }
                    }
                    else{
                        message.error('The Name cant be only space.');
                        setNameEdit(me.name);
                    }
                }
                else{
                    message.error('The Name cant be longer than 32 charaktars.');
                    setNameEdit(me.name);
                }
            }
            else{
                message.error('The Name has to be atlease one charaktar.');
                setNameEdit(me.name);
            }
        }
    };

    return (
        <div>
            <Row justify="center">
            <div style={{
            position: 'relative',
            display: 'inline-block'
                }}
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}>
                    <div className={hover||uploading ? 'avatar-blur' : ''}><UserAvatar key={avatarKey} user={me} size={120}/></div>
                    {uploading && (
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center'
                        }}>
                    <LoadingOutlined style={{ fontSize: '30px', color: 'white' }} spin />
                    </div>)}
                    {hover && !uploading && (
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center'
                        }}>
                            <DeleteOutlined style={{ fontSize: '24px', color: 'white', marginRight: '20px' }} className="icon-scale" onClick={handleAvatarDelete} />
                            <UploadOutlined style={{ fontSize: '24px', color: 'white' }} className="icon-scale" onClick={() => document.getElementById('avatar-upload-input')?.click()} />
                            <input id="avatar-upload-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleAvatarUpload(e.target.files![0])} />
                        </div>
                    )}
                </div>
            </Row>
            <Row justify="center">

                <Typography.Title 
                    editable={{ 
                        enterIcon: null,
                        onChange: (e) => {
                            setNameEdit(e);
                            handleNameBlur();
                        },
                        maxLength:32,
                    }} 
                    level={5} 
                    style={{ 
                        fontSize: '16px', 
                        width:'auto', 
                        marginTop:"10px"
                    }}
                >
                    {nameEdit}
                </Typography.Title>
            </Row>
            <Row justify="center">
                <Button style={{ marginTop: '10px' }} onClick={() => setPasswordModalVisible(true)}>
                    Change Password
                </Button>
                <Modal
                    title="Change Password"
                    open={passwordModalVisible}
                    onCancel={() => setPasswordModalVisible(false)}
                    onOk={handlePasswordChange}
                    okButtonProps={{
                        disabled: !(newPassword !== null && confirmPassword !== null && newPassword.length >= 8 && newPassword.length <= 16 && /\S/.test(newPassword) && newPassword === confirmPassword)
                    }}
                >
                    <Form form={form} name="registration-form">
                        <Form.Item
                            name="password"
                            rules={[
                                { required: true, message: 'Please enter your password' },
                                { min: 8, max: 16, message: 'Password must be between 8 and 16 characters' },
                                { whitespace: true, message: 'Password cannot be only spaces' }
                            ]}
                        >
                            <Input.Password placeholder="Password" onChange={(e) => setNewPassword(e.target.value)}/>
                        </Form.Item>
                        <Form.Item
                            name="confirmPassword"
                            dependencies={['password']}
                            hasFeedback
                            rules={[
                                {
                                    required: true,
                                    message: 'Please confirm your password',
                                },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('password') === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('The two passwords that you entered do not match'));
                                    },
                                }),
                            ]}
                        >
                            <Input.Password placeholder="Confirm Password" onChange={(e) => setConfirmPassword(e.target.value)}/>
                        </Form.Item>
                    </Form>
                </Modal>
            </Row>
            <Row justify="center">
                <Button style={{ marginTop: '10px' }} type="primary" danger icon={<LogoutOutlined />} onClick={handleLogout}>
                    Logout
                </Button>
            </Row>
        </div>
    );
};

export default ProfilePage;
