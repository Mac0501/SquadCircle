import React, { useEffect, useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import Auth from '../api/Auth';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [checkedVerification, setCheckedVerification] = useState(false);


  useEffect(() => {
    const checkVerification = async () => {
      try {
        const isVerified = await Auth.verify();
        if (isVerified) {
          window.location.href = '/'; // Redirect to homepage if verified
        }
        setCheckedVerification(!isVerified)
      } catch (error) {
        console.error('Error checking verification:', error);
        message.error('An error occurred while checking verification status');
      }
    };

    checkVerification(); // Call the function when the component mounts
  }, []);

  const onFinish = async (values: { name: any; password: any; }) => {
    setLoading(true);
    const { name, password } = values;
    try {
      const isAuthenticated = await Auth.authenticate(name, password);
      if (isAuthenticated) {
        window.location.href = '/';
      } else {
        message.error('Invalid username or password');
      }
    } catch (error) {
      console.error('Error during authentication:', error);
      if (error instanceof Error) {
        // Handle specific error messages from the server
        const errorMessage = error.message;
        message.error(errorMessage || 'An error occurred during login');
      }
      else{
        message.error('An error occurred during login');
      }
    } finally {
      setLoading(false);
    }
  };

  if(!checkedVerification){
    return null;
  }

  return (
    <div style={{ maxWidth: 400, margin: 'auto', marginTop: 100 }}>
      <h2>Login</h2>
      <Form
        name="login-form"
        onFinish={onFinish}
      >
        <Form.Item
          name="name"
          rules={[{ required: true, message: 'Please enter your username' }]}
        >
          <Input placeholder="Username" />
        </Form.Item>
        <Form.Item
          name="password"
          rules={[{ required: true, message: 'Please enter your password' }]}
        >
          <Input.Password placeholder="Password" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} style={{ width: '100%' }}>
            Login
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default Login;
