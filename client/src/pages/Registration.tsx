import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Form, Input, Button, message, theme, Layout } from 'antd';
import Auth from '../api/Auth';
import Invite from '../api/Invites';
import { Content } from 'antd/es/layout/layout';

const Registration = () => {
  const { code } = useParams<{ code?: string }>(); // Note the '?' to mark the parameter as optional
  const [loading, setLoading] = useState(false);
  const [validInvite, setValidInvite] = useState<boolean>(); // undefined represents initial state
  const [serverError, setServerError] = useState<string>(''); // State to hold server-side error message
  const [checkedVerification, setCheckedVerification] = useState(false);

  const {
    token: { colorBgContainer },
  } = theme.useToken();

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

  useEffect(() => {
    // Check if the code is valid when the component mounts
    if (code) {
      Invite.verifyCode(code)
        .then((isValid) => {
          setValidInvite(isValid);
        })
        .catch((error) => {
          console.error('Error verifying invite code:', error);
          message.error('An error occurred while verifying the invite code');
        });
    }
  }, [code]);

  const onFinish = async (values: { name: any; password: any; confirmPassword: any }) => {
    const { name, password, confirmPassword } = values;
    if (password !== confirmPassword) {
      message.error('Passwords do not match. Please try again.');
      return;
    }

    setLoading(true);
    try {
      const isRegistered = await Auth.register(name, password, code || ''); // Provide a default value for code
      if (isRegistered) {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error during registration:', error);
      if (error instanceof Error) {
        // Handle specific error messages from the server
        const errorMessage = error.message;
        setServerError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  if (validInvite === undefined || !checkedVerification) {
    // While validation is in progress, return null to display nothing
    return <div style={{backgroundColor:colorBgContainer}}></div>;
  }

  if (!validInvite) {
    // If the invite is not valid, display a message
    return (
      <Layout style={{ backgroundColor: colorBgContainer }}>
        <Content style={{ margin: '24px 16px 0', overflow: 'initial' }}>
          <div style={{backgroundColor: colorBgContainer, height: "100vh", display: "flex", flexDirection:"column", alignItems:"center"}}>
            <div style={{ maxWidth: "400px", width:"90vw", marginTop: "100px", marginRight: '0px', marginBottom: '0px', marginLeft: '0px' }}>
              <h2>Invalid Invite</h2>
              <p>The invite you're trying to use is not valid. Please contact the administrator for assistance.</p>
            </div>
          </div>
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ backgroundColor: colorBgContainer }}>
        <Content style={{ margin: '24px 16px 0', overflow: 'initial' }}>
          <div style={{backgroundColor: colorBgContainer, height: "100vh", display: "flex", flexDirection:"column", alignItems:"center"}}>
            <div style={{ maxWidth: "400px", width:"90vw", marginTop: "100px", marginRight: '0px', marginBottom: '0px', marginLeft: '0px' }}>
              <h2>Registration</h2>
              {serverError && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ color: 'red' }}>{serverError}</p>
                </div>
              )}
              <Form name="registration-form" onFinish={onFinish}>
                <Form.Item
                  name="name"
                  rules={[
                    { required: true, message: 'Please enter your username' },
                    { max: 32, message: 'Username cannot be longer than 32 characters' },
                    { whitespace: true, message: 'Username cannot be only spaces' }
                  ]}
                >
                  <Input placeholder="Username" />
                </Form.Item>
                <Form.Item
                  name="password"
                  rules={[
                    { required: true, message: 'Please enter your password' },
                    { min: 8, max: 16, message: 'Password must be between 8 and 16 characters' },
                    { whitespace: true, message: 'Password cannot be only spaces' }
                  ]}
                >
                  <Input.Password placeholder="Password" />
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
                  <Input.Password placeholder="Confirm Password" />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={loading} style={{ width: '100%' }}>
                    Register
                  </Button>
                </Form.Item>
              </Form>
            </div>
          </div>
      </Content>
    </Layout>
  );
};

export default Registration;
