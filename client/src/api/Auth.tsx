class Auth {
    static async authenticate(name: string, password: string) : Promise<boolean> {
        try {
            const response = await fetch("/api/auth", {
                method: "POST",
                credentials: 'include',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ name, password })
            });

            if (!response.ok) {
                const errorMessage = await response.json();
                throw new Error(errorMessage.reasons[0]);
            }
    
            return response.ok;
        } catch (error) {
            console.error("Error registering:", error);
            throw error;
        }
    }

    static async verify() : Promise<boolean> {
        try {
            const response = await fetch("/api/auth/verify", {
                method: "GET",
                credentials: 'include',
            });
            return response.ok;
        } catch (error) {
            console.error("Error verifying:", error);
            return false;
        }
    }

    static async logout() : Promise<boolean> {
        try {
            const response = await fetch("/api/auth/logout", {
                method: "POST",
                credentials: 'include',
            });
            return response.ok;
        } catch (error) {
            console.error("Error verifying:", error);
            return false;
        }
    }

    static async register(name: string, password: string, code: string): Promise<boolean> {
        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                credentials: 'include',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ name, password, code })
            });
    
            if (!response.ok) {
                const errorMessage = await response.json();
                throw new Error(errorMessage.message);
            }
    
            return response.ok;
        } catch (error) {
            console.error("Error registering:", error);
            throw error;
        }
    }
}


export default Auth