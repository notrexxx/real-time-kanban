import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router'; // <-- 1. Imported the router
import { useBoardStore } from '../../store/boardStore';

export default function BoardsScreen() {
  const { boards, isLoading, fetchBoards, createBoard } = useBoardStore();
  const [newBoardName, setNewBoardName] = useState('');
  const router = useRouter(); // <-- 2. Initialized the router

  // Automatically fetch boards when the screen loads
  useEffect(() => {
    fetchBoards();
  }, []);

  const handleCreate = async () => {
    if (!newBoardName.trim()) return;
    await createBoard(newBoardName);
    setNewBoardName('');
  };

  return (
    <View style={styles.container}>
      {/* Create Board Input */}
      <View style={styles.createSection}>
        <TextInput 
          style={styles.input} 
          placeholder="New Project Name..." 
          value={newBoardName}
          onChangeText={setNewBoardName}
        />
        <TouchableOpacity style={styles.button} onPress={handleCreate}>
          <Text style={styles.buttonText}>+ Create</Text>
        </TouchableOpacity>
      </View>

      {/* Boards List */}
      {isLoading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 20 }} />
      ) : (
        <FlatList 
          data={boards}
          // Use the ID if it exists, otherwise fall back to the list index
          keyExtractor={(item, index) => item.id ? String(item.id) : String(index)}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.boardCard}
              onPress={() => router.push(`/(boards)/${item.id}`)} 
            >
              <Text style={styles.boardTitle}>{item.name}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No workspaces yet. Create your first board above!</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f8fafc' },
  createSection: { flexDirection: 'row', marginBottom: 20 },
  input: { flex: 1, backgroundColor: '#fff', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', marginRight: 10 },
  button: { backgroundColor: '#3b82f6', padding: 15, borderRadius: 8, justifyContent: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  boardCard: { backgroundColor: '#fff', padding: 20, borderRadius: 8, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2, borderWidth: 1, borderColor: '#e2e8f0' },
  boardTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  emptyText: { textAlign: 'center', color: '#64748b', marginTop: 40, fontSize: 16 }
});