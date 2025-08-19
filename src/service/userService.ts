// src/services/userService.ts
interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }
  
  // In a real app, this would be an API call
  export const registerUser = async (userData: Omit<User, 'id'>): Promise<User> => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const existingUser = users.find((user: User) => user.email === userData.email);
    
    if (existingUser) {
      throw new Error('User already exists');
    }
  
    const newUser = {
      ...userData,
      id: Date.now().toString(),
    };
  
    localStorage.setItem('users', JSON.stringify([...users, newUser]));
    return newUser;
  };
  
  export const loginUser = async (email: string, password: string): Promise<User> => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find((user: User) => user.email === email && user.password === password);
    
    if (!user) {
      throw new Error('Invalid email or password');
    }
  
    return user;
  };