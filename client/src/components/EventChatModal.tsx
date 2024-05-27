import { Button, Divider, Input, Modal, Tag, Typography } from "antd";
import { useEffect, useRef, useState } from "react";
import Event from "../api/Event";
import Me from "../api/Me";
import { EventStateEnum, UserGroupPermissionEnum } from "../utils/types";
import Group from "../api/Group";
import User from "../api/User";
import { SendOutlined, CommentOutlined } from '@ant-design/icons';
import Message from "../api/Message";
import { displayTimeWithZone } from "../utils/formatDisplayes";
import { colorMap, getColorFromId, getKeyByEnumValue } from "../utils/tools";
import UserAvatar from "./UserAvatar";
import moment from "moment";

interface EventModalProps {
    me: Me,
    mePermissions: UserGroupPermissionEnum[],
    visible: boolean;
    onFinish: () => void;
    onCancel: () => void;
    event: Event;
    group: Group;
    members: User[];
}

const EventChatModal: React.FC<EventModalProps> = ({ me, mePermissions, visible, onFinish, onCancel, event, group, members }) => {
    const [newMessage, setNewMessage] = useState<string>("");
    const [messages, setMessages] = useState<Message[]>([]);
    const ws = useRef<WebSocket | null>(null);
    const messageContainerRef = useRef<HTMLDivElement>(null);
    const [chatEnd, setChatEnd] = useState<boolean>(false);
    const fetchingMessagesRef = useRef<boolean>(false);

    const fetchMessages = async (timestamp?: string) => {
        if(!chatEnd){
            fetchingMessagesRef.current = true;
            const messagesList = await event.get_messages_for_event(20, timestamp);
            setMessages((prevMessages) => {
            // Check if the first message in messagesList is already in prevMessages
            if (messagesList.length > 0 && prevMessages.some(msg => msg.id === messagesList[0].id)) {
                return prevMessages;
            } else {
                return [...prevMessages, ...messagesList];
            }
        });
            if(messagesList.length !== 20){
                setChatEnd(true);
            }
            fetchingMessagesRef.current = false;
        }
    };

    const handleScroll = () => {
        const container = messageContainerRef.current;
        if (container) {
            // Check if the user has scrolled to the bottom of the container
            if (container.scrollTop * -1 + container.clientHeight >= container.scrollHeight * 0.95) {
                // Fetch more messages if not already fetching
                if (!fetchingMessagesRef.current) {
                    // Calculate the timestamp for the last message in the current list
                    const lastMessageTimestamp = messages.length > 0 ? messages[messages.length - 1].sent_at : undefined;
                    fetchMessages(lastMessageTimestamp).catch((error) => {
                        console.error("Error fetching messages:", error);
                    });
                }
            }
        }
    };
    
    useEffect(() => {
        // Add event listener for scrolling
        const container = messageContainerRef.current;
        if (container) {
            container.addEventListener("scroll", handleScroll);
        }
        return () => {
            // Remove event listener on cleanup
            if (container) {
                container.removeEventListener("scroll", handleScroll);
            }
        };
    }, [messages]);

    useEffect(() => {
        setMessages([])
        setChatEnd(false)

        if (visible) {
            // Connect to WebSocket when modal is visible
            ws.current = new WebSocket(`${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/api/events/chat/${event.id}`);
            
            ws.current.onopen = () => {
                console.log("WebSocket connection established");
            };

            ws.current.onmessage = (event) => {
                try{
                    const message = Message.fromJson(JSON.parse(event.data))
                    setMessages((prevMessages) => [message, ...prevMessages]);
                } catch(error){
                    console.log("sth went wrong")
                }
            };

            ws.current.onclose = () => {
                console.log("WebSocket connection closed");
            };

            ws.current.onerror = (error) => {
                console.error("WebSocket error:", error);
            };

            fetchMessages();

            // Clean up WebSocket connection when the component unmounts or modal closes
            return () => {
                if (ws.current) {
                    ws.current.close();
                }
            };
        }
    }, [visible]);

    const sendMessage = () => {
        if (ws.current && newMessage.trim() && newMessage.length > 0) {
            ws.current.send(JSON.stringify({ content: newMessage }));
            setNewMessage("");
        }
    };
    
    const getPrevDateInUserTimeZone = (dateString: string): string => {
    
        const datetime = moment(dateString);

        const today = moment().startOf('day');

        // Get yesterday's date
        const yesterday = moment().subtract(1, 'day').startOf('day');

        // Check if the date is today
        if (datetime.isSame(today, 'day')) {
            return 'Today';
        }

        // Check if the date is yesterday
        if (datetime.isSame(yesterday, 'day')) {
            return 'Yesterday';
        }

        // Convert to browser's timezone
        const browserTimezone = moment.tz.guess();
        const datetimeInBrowserTimezone = datetime.clone().tz(browserTimezone);

        // Format the datetime and return
        return datetimeInBrowserTimezone.format('LL');
    };

    
    return (
        <div>
            <Modal
                title={ <><span style={{paddingRight:"10px"}}>Event</span><Tag
                color={`${colorMap[event.state]}`}
                style={{ marginInlineEnd: 4, color:'#000', fontSize:"14px", fontWeight:"500" }}
            >
                {getKeyByEnumValue(EventStateEnum, event.state)}
            </Tag></>}
                width="900px"
                open={visible}
                onCancel={onCancel}
                onOk={()=>{onFinish()}}
                footer={
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button type="primary" onClick={onCancel} key="submit">
                            Close
                        </Button>
                    </div>
                }
            >
                <div style={{marginTop:'24px', marginBottom:'12px'}}>
                    <Typography.Title
                        level={3}
                        style={{margin:'0px'}}
                    >
                        {event.title}
                    </Typography.Title>
                </div>
                <div style={{backgroundColor:"#101010", height:"400px" , borderRadius:"5px",}}>
                    <div style={{display:"flex", flexDirection:"column", justifyContent:"space-between", height:"100%"}}>
                        <div style={{display:"flex", flexGrow:"1", overflowY:"auto", flexDirection:"column-reverse"}} ref={messageContainerRef}>
                            {messages.length > 0 ? (
                                messages.map((msg, index) => {
                                    const prevMsg = messages[index - 1];
                                    let isNewDay = false;
                                    let prevDateInUserTimeZone = null;
                                    if(prevMsg){
                                        const currentDate = new Date(msg.sent_at).toDateString();
                                        const prevDate = prevMsg ? new Date(prevMsg.sent_at).toDateString() : null;
                                        isNewDay = prevDate !== null && currentDate !== prevDate;
                                        prevDateInUserTimeZone = getPrevDateInUserTimeZone(prevMsg.sent_at);
                                    }


                                    if(msg.user_and_group?.user_id === me.id){
                                        
                                        return(
                                            <div key={msg.id}>
                                                <div style={{display:"flex", margin:"8px 7px 8px 7px", flexDirection:"row", justifyContent:"end"}}>
                                                    <div style={{display:"flex", flexDirection:"column", backgroundColor:"#19541c", marginBottom: "10px", padding: "10px", borderRadius: "15px 3px 15px 15px", maxWidth:"80%", minWidth:"100px" }}>
                                                        <span style={{ color: "#fff", wordBreak: "break-word", whiteSpace: "pre-wrap", marginRight: "15px" }}>{msg.content}</span>
                                                        <div style={{fontSize:"12px", display:"flex", justifyContent:"end", marginTop:"2px" }}>
                                                            {displayTimeWithZone(msg.sent_at)}
                                                        </div>
                                                    </div>
                                                </div>
                                                {isNewDay && (
                                                    <div style={{margin:"0px 8px 0px 8px"}}>
                                                        <Divider plain>{prevDateInUserTimeZone}</Divider>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    }else{
                                        const user = members.find(member => member.id === msg.user_and_group?.user_id);
                                        if (!user) return null; 
                                        return(
                                            <div key={msg.id}>
                                                <div style={{display:"flex", margin:"8px 7px 8px 7px", flexDirection:"row", justifyContent:"start", maxWidth:"80%"}}>
                                                    <div style={{display:"flex", justifyContent:"start", marginRight:"5px", marginTop:"5px"}}>
                                                        <UserAvatar user={user}/>
                                                    </div>
                                                    <div style={{display:"flex", flexDirection:"column", backgroundColor: "#37383d", marginBottom: "10px", padding: "10px", borderRadius: "3px 15px 15px 15px", minWidth:"100px" }}>
                                                        <span style={{ color: `${getColorFromId(msg.user_and_group?.user_id ?? 1)}`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block', maxWidth: '100%' }}>
                                                            {user.name}
                                                        </span>
                                                        <span style={{ color: "#fff", wordBreak: "break-word", whiteSpace: "pre-wrap", marginRight: "15px"  }}>{msg.content}</span>
                                                        <div style={{fontSize:"12px", display:"flex", justifyContent:"end", marginTop:"2px" }}>
                                                            {displayTimeWithZone(msg.sent_at)}
                                                        </div>
                                                    </div>
                                                </div>
                                                {isNewDay && (
                                                    <div style={{margin:"0px 8px 0px 8px"}}>
                                                        <Divider plain>{prevDateInUserTimeZone}</Divider>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    }
                                })
                            ) : (
                                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%"}}>
                                    <CommentOutlined style={{fontSize:"150px",}}/>
                                    <span style={{fontSize:"20px", textAlign:"center"}}>There are no messages yet</span>
                                </div>
                            )}
                        </div>
                        <div style={{display:"flex", backgroundColor:"#1f1f1f", margin:"7px", borderRadius:"5px", flexDirection:"row", justifyContent:"center"}}>
                            <div style={{flexGrow:"1", alignItems:"center"}}>
                                <Input.TextArea
                                    value={newMessage}
                                    placeholder="Message"
                                    autoSize={{ minRows: 1, maxRows: 4 }}
                                    variant="borderless"
                                    maxLength={Message.content_length}
                                    onChange={(e)=>{setNewMessage(e.target.value)}}
                                />
                            </div>
                            <div style={{display:"flex", margin:"8px", borderRadius:"50%", alignItems:"end", cursor:"pointer"}} onClick={sendMessage}>
                                <SendOutlined />
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default EventChatModal;
