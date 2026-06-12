import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { useBoardStore } from '../../store/boardStore';

export default function BoardDetailScreen() {
  const { id } = useLocalSearchParams(); 
  const router = useRouter();
  const { currentBoard, isLoading, fetchBoardById, createColumn, createCard } = useBoardStore();
  
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [newCardTitles, setNewCardTitles] = useState<Record<string, string>>({});

  useEffect(() => {
    if (id) fetchBoardById(String(id));
  }, [id]);

  const handleAddColumn = async () => {
    if (!newColumnTitle.trim() || !currentBoard) return;
    await createColumn(currentBoard.id, newColumnTitle);
    setNewColumnTitle('');
  };

  const handleAddCard = async (columnId: string) => {
    const title = newCardTitles[columnId];
    if (!title || !title.trim()) return;
    
    await createCard(columnId, title);
    setNewCardTitles({ ...newCardTitles, [columnId]: '' });
  };

  if (isLoading || !currentBoard) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{currentBoard.name}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.boardArea}>
        {currentBoard.columns?.map((col) => (
          <View key={col.id} style={styles.column}>
            <View style={styles.columnHeader}>
              <Text style={styles.columnTitle}>{col.title}</Text>
              <Text style={styles.cardCount}>{col.cards?.length || 0}</Text>
            </View>
            
            <ScrollView style={styles.cardList}>
              {col.cards?.map((card) => (
                <View key={card.id} style={styles.card}>
                  <Text style={styles.cardTitle}>{card.title}</Text>
                </View>
              ))}
            </ScrollView>

            <TextInput
              style={styles.addCardInput}
              placeholder="+ Add a card..."
              value={newCardTitles[col.id] || ''}
              onChangeText={(text) => setNewCardTitles({ ...newCardTitles, [col.id]: text })}
              onSubmitEditing={() => handleAddCard(col.id)}
            />
          </View>
        ))}

        <View style={styles.addColumnContainer}>
          <TextInput 
            style={styles.addColumnInput}
            placeholder="+ Add a list..."
            value={newColumnTitle}
            onChangeText={setNewColumnTitle}
            onSubmitEditing={handleAddColumn} 
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  backButton: { padding: 5 },
  backText: { color: '#3b82f6', fontWeight: 'bold', fontSize: 16 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  placeholder: { width: 50 },
  boardArea: { flex: 1, padding: 15 },
  column: { width: 300, backgroundColor: '#f1f5f9', borderRadius: 10, padding: 15, marginRight: 15, height: '100%', maxHeight: '90%' },
  columnHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  columnTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  cardCount: { backgroundColor: '#e2e8f0', color: '#64748b', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, fontSize: 12, fontWeight: 'bold' },
  cardList: { flex: 1 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1, borderWidth: 1, borderColor: '#e2e8f0' },
  cardTitle: { fontSize: 14, color: '#334155', fontWeight: '500' },
  addCardInput: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginTop: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  addColumnContainer: { width: 300, marginRight: 30 },
  addColumnInput: { backgroundColor: '#ffffff', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', fontSize: 16 }
});