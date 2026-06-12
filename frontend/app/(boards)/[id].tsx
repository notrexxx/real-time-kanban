import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export default function BoardDetailScreen() {
  // Grab the dynamic ID from the URL (e.g., /(boards)/5)
  const { id } = useLocalSearchParams(); 
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Board Workspace</Text>
        <View style={styles.placeholder} />
      </View>

      <Text style={styles.subtitle}>Viewing Board ID: {id}</Text>

      {/* The Horizontal Column Grid (Coming Next!) */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.boardArea}
      >
        {/* We will map our columns here shortly */}
        <View style={styles.emptyColumnArea}>
          <Text style={styles.emptyText}>Ready to build the drag-and-drop columns!</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  backButton: { padding: 5 },
  backText: { color: '#3b82f6', fontWeight: 'bold', fontSize: 16 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  placeholder: { width: 50 }, // Balances the header flex
  subtitle: { padding: 20, color: '#64748b', fontWeight: '500' },
  boardArea: { flex: 1, paddingHorizontal: 10 },
  emptyColumnArea: { flex: 1, justifyContent: 'center', alignItems: 'center', minWidth: 300, marginTop: 50 },
  emptyText: { color: '#94a3b8', fontStyle: 'italic' }
});