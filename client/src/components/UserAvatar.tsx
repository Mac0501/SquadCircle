import React, { useState } from 'react';
import { Avatar } from 'antd';
import Me from '../api/Me';
import User from '../api/User';

interface UserAvatarProps {
    user: User | Me;
    size?: number;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ user, size=30 }) => {
    const [avatarError, setAvatarError] = useState<boolean>(false);

    const handleAvatarError = () => {
        setAvatarError(true);
        console.log("me")
        return true;
    };

    const getColorFromId = (id: number): string => {

        const colors = ['#FFC0CB', '#ADD8E6', '#98FB98', '#FFD700', '#FFA07A', '#87CEFA', '#F08080', '#90EE90', '#AFEEEE'];
    
        const colorIndex = id % colors.length;
    
        return colors[colorIndex];
    };

    const fontSize = size <= 30 ? 14 : size * 0.5;

    return (
        <>
            {user.avatar && !avatarError ? (
                <Avatar src={`${window.location.origin}${user.avatar}`} alt="Avatar" onError={handleAvatarError} size={size}/>
            ) : (
                <Avatar style={{ backgroundColor: getColorFromId(user.id), fontSize}} size={size}>
                    {user.name.charAt(0).toUpperCase()}
                </Avatar>
            )}
        </>
    );
};

export default UserAvatar;
