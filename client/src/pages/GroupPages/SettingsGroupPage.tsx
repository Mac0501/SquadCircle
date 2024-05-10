import React, { useState } from 'react';
import Me from '../../api/Me';
import Group from '../../api/Group';
import { UserGroupPermissionEnum } from '../../utils/types';
import { Button, Col, Form, Input, Modal, Row, Typography, message } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

interface SettingsGroupPageProps {
    me: Me,
    group: Group,
    mePermissions: UserGroupPermissionEnum[];
}

const SettingsGroupPage: React.FC<SettingsGroupPageProps> = ({ me, group, mePermissions }) =>  {
    const [groupName, setGroupName] = useState<string>(group.name);
    const [discordWebhook, setDiscordWebhook] = useState<string | null | undefined>(undefined);
    const [groupDescription, setGroupDescription] = useState<string | null>(group.description);
    const [groupLeaveModalVisible, setGroupLeaveModalVisible] = useState<boolean>(false);
    const [groupDiscordWebhookModalVisible, setGroupDiscordWebhookModalVisible] = useState<boolean>(false);
    const allowedToEdit = (me.owner || mePermissions.includes(UserGroupPermissionEnum.ADMIN));
    

    const updateGroup = async (name:string, description:string|null) => {
        if (!allowedToEdit || name.length === 0) {
            setGroupName(group.name)
            setGroupDescription(group.description)
            return; // Don't proceed if user is not allowed to edit
        }

        // Call the update method of the Group API
        const success = await group.update(name, description);

        if (success) {
            message.success('Group updated successfully'); // Show success message
        } else {
            setGroupName(group.name)
            setGroupDescription(group.description)
        }
    };

    const handleGroupLeave = async () => {
        const success = await Me.remove_me_from_group(group);
        if (success) {
            message.success('Group left successfully');
            window.location.href = "/homepage"
        } else {
            // Error leaving group
            message.error('Failed to leave group. Please try again later.');
        }
    };

    const handleUpdateGroupDiscordWebhook = async () => {
        setGroupDiscordWebhookModalVisible(false);
        const success = await group.update(groupName, groupDescription, discordWebhook);
        if (success) {
            message.success('Updated group Discord-Webhook');
        } else {
            message.error('Failed to updated group Discord-Webhook');
        }
        setDiscordWebhook(undefined);
    };

    const handleRemoveGroupDiscordWebhook = async () => {
        setDiscordWebhook(null);
        const success = await group.update(groupName, groupDescription, null);
        if (success) {
            message.success('Removed Discord-Webhook from group');
        } else {
            message.error('Failed to remove Discord-Webhook from group');
        }
        setDiscordWebhook(undefined);
    };

    const isDiscordWebhookValid = (discord_webhook:string|null|undefined) => {
        if(discord_webhook === null || discord_webhook === undefined || discord_webhook === ""){
            return true;
        }
        if (discord_webhook.includes("https://discord.com/api/webhooks/")){
            return true;
        }
        return false;

    };

    return (
        <div style={{ display: "flex", flexDirection:"column", alignItems: "start", justifyContent: "start", gap:'10px' }}>
            <div style={{marginTop:'24px', marginBottom:'12px', width:'100%'}}>
                <Typography.Title
                    level={3}
                    style={{margin:'0px', width:'100%'}}
                    { ...(allowedToEdit ? { editable: { 
                                            onChange: (name:string) => {
                                                setGroupName(name);
                                                updateGroup(name, group.description); 
                                            },
                                            enterIcon: null,
                                            maxLength:32,
                                        } } : {}) }
                >
                    {groupName}
                </Typography.Title>
            </div>
            <Typography.Paragraph
                style={{margin:'0px', width:'100%'}}
                { ...(allowedToEdit ? { editable: { 
                                        onChange: (description:string) => {
                                            setGroupDescription(description);
                                            updateGroup(group.name, description);
                                        },
                                        enterIcon: null,
                                        maxLength:2000,
                                    } } : {}) }
            >
                {groupDescription}
            </Typography.Paragraph>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', backgroundColor:"rgb(20 20 20 / 82%)" }}>
                <span style={{marginRight:"5px"}}>Discord-Webhook:</span>
                {group.discord_webhook ? (
                    <>
                        <CheckCircleOutlined style={{marginRight:"5px", color:"#52c41a"}}/>
                        <span>Activated</span>
                    </>
                ) : (
                    <>
                        <CloseCircleOutlined style={{marginRight:"5px", color:"#f44"}}/>
                        <span>Deactivated</span>
                    </>
                )}
            </div>
            {allowedToEdit && (
                <Row justify="center" gutter={16}>
                    <Col xs={24} md={12} style={{ marginBottom: '16px' }}>
                        <Button type="primary" onClick={() => setGroupDiscordWebhookModalVisible(true)} block style={{width:"auto"}}>
                            Update Discord-Webhook
                        </Button>
                    </Col>
                    <Col xs={24} md={12} style={{ marginBottom: '16px' }}>
                        <Button type="primary" danger onClick={() => handleRemoveGroupDiscordWebhook()} block style={{width:"auto"}}>
                            Delete Discord-Webhook
                        </Button>
                    </Col>
                </Row>
            )}
            <Button type="primary" danger onClick={() => setGroupLeaveModalVisible(true)}>
                Leave Group
            </Button>
            <Modal
                title="Confirm Group Leave"
                open={groupLeaveModalVisible}
                onOk={handleGroupLeave}
                onCancel={() => setGroupLeaveModalVisible(false)}
                okText="Leave"
                cancelText="Cancel"
            >
                Are you sure you want to leave this Group?
            </Modal>
            <Modal
                title="Update Discord-Webhook"
                open={groupDiscordWebhookModalVisible}
                onOk={handleUpdateGroupDiscordWebhook}
                onCancel={() => {
                    setGroupDiscordWebhookModalVisible(false);
                    setDiscordWebhook(undefined);
                }}
                okText="Update"
                cancelText="Cancel"
            >
                <Form layout="vertical">
                    <Form.Item validateStatus={isDiscordWebhookValid(discordWebhook) ? '':'error'} help={isDiscordWebhookValid(discordWebhook) ? '':'The Discord-Webhook has to start with "https://discord.com/api/webhooks/"'}>
                        <Input 
                            placeholder="Enter a Discord-Webhook to update (https://discord.com/api/webhooks/...)"
                            value={discordWebhook ? discordWebhook : ""} 
                            maxLength={130} 
                            onChange={(e) => {
                                setDiscordWebhook(e.target.value);
                            }}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default SettingsGroupPage;
