import { Stack } from 'expo-router';
import { TouchableOpacity, Text } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function BoardsLayout() {
  const { signOut } = useAuth();
  
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'My Workspaces',
          headerRight: () => (
            <TouchableOpacity onPress={signOut}>
              <Text style={{ color: '#ef4444', fontWeight: 'bold', marginRight: 15 }}>Log Out</Text>
            </TouchableOpacity>
          )
        }} 
      />
    </Stack>
  );
}