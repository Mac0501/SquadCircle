import React, { useState } from 'react';
import { Avatar } from 'antd';
import Me from '../api/Me';
import User from '../api/User';
import { getColorFromId } from '../utils/tools';

interface UserAvatarProps {
    user: User | Me;
    size?: number;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ user, size=30 }) => {
    const [avatarError, setAvatarError] = useState<boolean>(false);

    const handleAvatarError = () => {
        setAvatarError(true);
        return true;
    };

    const fontSize = size <= 30 ? 14 : size * 0.5;

    return (
        <>
            {user.avatar && !avatarError && user.has_avatar ? (
                <Avatar src={`${window.location.origin}${user.avatar}`} alt="Avatar" onError={handleAvatarError} size={size}/>
            ) : (
                <Avatar style={{ backgroundColor: getColorFromId(user.id), fontSize, color:"#000"}} size={size}>
                    {user.name.charAt(0).toUpperCase()}
                </Avatar>
            )}
        </>
    );
};

export default UserAvatar;
