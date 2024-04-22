import React, { useState, useEffect } from 'react';
import { Menu, Avatar } from 'antd';
import { Link } from 'react-router-dom';
import Me from '../api/Me';

const Navigation = () => {
  const [user, setUser] = useState<Me | null>(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const currentUser = await Me.get_me();
        setUser(currentUser);
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };

    fetchUserInfo();
  }, []);

  return (
    <Menu theme="dark" mode="inline" defaultSelectedKeys={['home']}>
      <Menu.Item key="home">
        <Link to="/">Home</Link>
      </Menu.Item>
      <Menu.Item key="dashboard">
        <Link to="/dashboard">Dashboard</Link>
      </Menu.Item>
      {user && (
        <Menu.Item key="user" style={{ marginTop: 'auto' }}>
          <Avatar src="./users/me/avatar" />
          <span style={{ marginLeft: 8 }}>{user.name}</span>
        </Menu.Item>
      )}
    </Menu>
  );
};

export default Navigation;
