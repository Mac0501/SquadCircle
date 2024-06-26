import React, { Suspense, useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Auth from "../api/Auth";
import { Avatar, Button, Layout, Menu, theme } from 'antd';
import {
  UserOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons';
import Me from "../api/Me";

import type { MenuProps } from 'antd';
import Group from "../api/Group";
import UserAvatar from "./UserAvatar";
import SquadCircle from "../assets/SquadCircle.webp"
const GroupPage = React.lazy(() => import("../pages/GroupPage"));
const Homepage = React.lazy(() => import("../pages/Homepage"));
const ProfilePage = React.lazy(() => import("../pages/Profilepage"));
const Admin = React.lazy(() => import("../pages/AdminPage"));

type MenuItem = Required<MenuProps>['items'][number];

function getItem(
    label: React.ReactNode,
    key?: React.Key | null,
    icon?: React.ReactNode,
    children?: MenuItem[],
    type?: 'group',
  ): MenuItem {
    return {
      key,
      icon,
      children,
      label,
      type,
    } as MenuItem;
  }

const {  Content, Sider, Header } = Layout;

const ProtectedRoute: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | undefined>(undefined);
    const [me, setMe] = useState<Me | null>(null);
    const [groups, setGroups] = useState<Group[]>([]);
    const navigate = useNavigate();
    const [selectedKey, setSelectedKey] = useState<string | null>('1');
    const [collapsed, setCollapsed] = useState<boolean>(false);
    const [collapsable, setCollapsable] = useState<boolean>(false);
    const [avatarKey, setAvatarKey] = useState<number>(1);

    const {
      token: { colorBgContainer },
    } = theme.useToken();

    const getAvatarContent = () => {
        if (me) {
          return (
            <>
              <UserAvatar user={me} size={35} key={avatarKey}/>
              <span style={{ marginLeft: 8 }}>{me.name}</span>
            </>
          );
        } else {
          return (
            <>
              <Avatar style={{ backgroundColor: '#87d068' }} icon={<UserOutlined />} />
              <span style={{ marginLeft: 8 }}>Guest</span>
            </>
          );
        }
      };

      const items: MenuItem[] = [
        getItem(getAvatarContent(), 'profile'),
        ...(me && me.owner ? [getItem("Admin", 'admin/users')] : []),
        getItem('Groups', 'grp', null, [
            ...groups.map(group => getItem(group.name, `group/${group.id}`))
        ], 'group'),
    ];

    useEffect(() => {
      Auth.verify().then((result: boolean) => {
          setIsAuthenticated(result);
          if (!result) {
              // If not authenticated, navigate to login page
              navigate('/login');
          }
      });
  }, [navigate]);

    useEffect(() => {
        const fetchMeInfo = async () => {
          try {
            const currentMe = await Me.get_me();
            setMe(currentMe);
            const my_groups = await Me.get_me_groups()
            setGroups(my_groups)
          } catch (error) {
            console.error('Error fetching me info:', error);
          }
        };
    
        fetchMeInfo();
      }, []);
  
    if (isAuthenticated === undefined || me === null) {
      return null; // Render nothing until the promise resolves
    }
  
    return (
      <>
        {isAuthenticated ? (
          <>
          <Layout hasSider style={{ backgroundColor:"#101010"}}>
            <Sider
            breakpoint="lg"
            collapsedWidth="0"
            style={{ zIndex: 1000, height: '100vh', overflowX: 'hidden', position: collapsable ? 'fixed' : "sticky", top:0, left:0, backgroundColor:colorBgContainer, boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',}}
            collapsible
            onBreakpoint={(collapsed) => setCollapsable(collapsed)}
            collapsed={collapsed}
            onCollapse={(collapsed) => setCollapsed(collapsed)}
            >
              <div
                  style={{ display:"flex", textAlign:"center", justifyContent:"center", alignItems: 'center', padding: '16px', color: '#fff', fontSize: '20px', cursor: 'pointer', backgroundColor:colorBgContainer }}
                  onClick={() => {
                    setSelectedKey(null); // Deselect menu item
                    navigate('/homepage');
                  }}
              >
                  <img src={SquadCircle} alt="SquadCircle Logo" style={{ marginRight: '10px', width:"30px", height:"30px" }}/>
                  SquadCircle
              </div>
              <Menu
                mode="inline"
                defaultSelectedKeys={['1']}
                selectedKeys={selectedKey ? [selectedKey] : []}
                style={{ height: 'auto', borderRight: 0 }}
                onSelect={({ key }) => {
                  setSelectedKey(key);
                  navigate(`/${key}`);
                  if(collapsable){
                    setCollapsed(!collapsed)
                  }
                }}
                items={items}
              />
            </Sider>
            <Layout style={{ backgroundColor:"#101010"}}>
            {collapsable && !collapsed && (
              <div
                onClick={() => setCollapsed(!collapsed)}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 999,
                  backdropFilter:"blur(5px)",
                  backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent black
                }}
              />
            )}
            {collapsable && (
            <Header style={{ padding: 0, backgroundColor:"#101010", height:'32px'}}>
              <Button
                type="text"
                icon={<MenuUnfoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{
                  fontSize: '16px',
                  width:'32px',
                  height:'32px',
                  opacity: collapsed ? 1 : 0,
                }}
              />
            </Header>
            )}
              <Content style={{ margin: '24px 16px 0', overflow: 'initial' }}>
                <Suspense fallback={<div></div>}>
                  <Routes>
                    <Route path={`/`} element={<Navigate to="/homepage" replace={true} />} />
                    <Route path={`/homepage`} element={<Homepage/>} />
                    <Route path={`/profile`} element={<ProfilePage me={me} setSidabarAvatarKey={setAvatarKey}/>} />
                    <Route path={`/admin`} element={<Navigate to="/admin/users" replace={true} />} />
                    <Route path={`/admin/*`} element={me.owner ? <Admin me={me} /> : <Navigate to="/homepage" replace={true} />} />
                      {groups.map(group => (
                        <Route key={`group/${group.id}`} path={`/group/${group.id}/*`} element={<GroupPage key={group.id} me={me} group={group} />} />
                      ))}
                  </Routes>
                </Suspense>
              </Content>
            </Layout>
          </Layout>
          </>
        ) : (
          <Navigate to="/login" replace={true} />
        )}
      </>
    );
  };

export default ProtectedRoute;
